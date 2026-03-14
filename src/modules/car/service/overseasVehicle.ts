import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { OverseasVehicleEntity } from '../entity/overseasVehicle';
import { OverseasContainerEntity } from '../entity/overseasContainer';

@Provide()
export class OverseasVehicleService extends BaseService {
  @InjectEntityModel(OverseasVehicleEntity)
  overseasVehicleRepo: Repository<OverseasVehicleEntity>;

  @InjectEntityModel(OverseasContainerEntity)
  overseasContainerRepo: Repository<OverseasContainerEntity>;

  /**
   * Create overseas vehicle record (called when Decision → Overseas).
   */
  async createFromDecision(carID: number): Promise<OverseasVehicleEntity> {
    let record = await this.overseasVehicleRepo.findOne({ where: { carID } });
    if (record) return record;

    record = await this.overseasVehicleRepo.save({
      carID,
      stage: 'ready',
      readyAt: new Date(),
    });
    return record;
  }

  /**
   * Assign vehicle to a container.
   */
  async assignToContainer(carID: number, containerID: number): Promise<void> {
    const record = await this.overseasVehicleRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No overseas record for car ${carID}`);

    await this.overseasVehicleRepo.update(record.id, {
      stage: 'assigned',
      containerID,
      assignedAt: new Date(),
    });

    // Update container loaded count
    await this.refreshContainerCount(containerID);
  }

  /**
   * Mark vehicle as loaded.
   */
  async markLoaded(carID: number): Promise<void> {
    const record = await this.overseasVehicleRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No overseas record for car ${carID}`);

    await this.overseasVehicleRepo.update(record.id, {
      stage: 'loaded',
      loadedAt: new Date(),
    });

    if (record.containerID) {
      await this.refreshContainerCount(record.containerID);
    }
  }

  /**
   * Close / mark shipped.
   */
  async close(carID: number): Promise<void> {
    const record = await this.overseasVehicleRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No overseas record for car ${carID}`);

    await this.overseasVehicleRepo.update(record.id, {
      stage: 'closed',
      closedAt: new Date(),
    });
  }

  /**
   * Move back to previous stage.
   */
  async moveBack(carID: number): Promise<string> {
    const record = await this.overseasVehicleRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No overseas record for car ${carID}`);

    const PREV: Record<string, string> = {
      assigned: 'ready',
      loaded: 'assigned',
      closed: 'loaded',
    };
    const prev = PREV[record.stage];
    if (!prev) throw new Error(`Cannot move back from "${record.stage}"`);

    await this.overseasVehicleRepo.update(record.id, { stage: prev });
    return prev;
  }

  // ===== Container management =====

  /**
   * Create a new container.
   */
  async createContainer(data: Partial<OverseasContainerEntity>): Promise<OverseasContainerEntity> {
    return this.overseasContainerRepo.save({
      ...data,
      status: data.status || 'ready',
    });
  }

  /**
   * Update container.
   */
  async updateContainer(id: number, data: Partial<OverseasContainerEntity>): Promise<void> {
    delete (data as any).id;
    await this.overseasContainerRepo.update(id, data);
  }

  /**
   * Change container status.
   */
  async changeContainerStatus(id: number, status: string): Promise<void> {
    const update: any = { status };
    if (status === 'closed') update.dispatchDate = new Date();
    if (status === 'delivered') update.deliveredDate = new Date();

    await this.overseasContainerRepo.update(id, update);
  }

  /**
   * Refresh container loaded count from overseas_vehicle records.
   */
  async refreshContainerCount(containerID: number): Promise<void> {
    const vehicles = await this.overseasVehicleRepo.find({ where: { containerID } });
    const loadedCount = vehicles.filter(v => v.stage === 'loaded').length;
    const totalAssigned = vehicles.length;

    const container = await this.overseasContainerRepo.findOne({ where: { id: containerID } });
    if (!container) return;

    const capacity = container.capacity || totalAssigned || 1;
    const loadingPercent = Math.round((loadedCount / capacity) * 100);

    await this.overseasContainerRepo.update(containerID, {
      loadedCount,
      loadingPercent,
    });
  }

  /**
   * Get vehicles in a container.
   */
  async getVehiclesByContainer(containerID: number): Promise<OverseasVehicleEntity[]> {
    return this.overseasVehicleRepo.find({ where: { containerID }, order: { id: 'ASC' } });
  }
}
