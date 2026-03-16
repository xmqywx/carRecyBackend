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
   * Start dismantling (ready → dismantling).
   * Usually called automatically by OverseasPartsService.addPart().
   */
  async startDismantling(carID: number): Promise<void> {
    const record = await this.overseasVehicleRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No overseas record for car ${carID}`);
    if (record.stage !== 'ready') return;

    await this.overseasVehicleRepo.update(record.id, { stage: 'dismantling' });
  }

  /**
   * Complete dismantling (dismantling → dismantled).
   */
  async completeDismantling(vehicleId: number): Promise<void> {
    await this.overseasVehicleRepo.update(vehicleId, {
      stage: 'dismantled',
      dismantledAt: new Date(),
    });
  }

  // ===== Container management (status changes only) =====

  /**
   * Change container status.
   */
  async changeContainerStatus(id: number, status: string): Promise<void> {
    const update: any = { status };
    const now = new Date();
    if (status === 'sealed') update.sealDate = now;
    if (status === 'sold' || status === 'closed') update.dispatchDate = now;
    if (status === 'collected' || status === 'delivered') update.deliveredDate = now;

    await this.overseasContainerRepo.update(id, update);
  }
}
