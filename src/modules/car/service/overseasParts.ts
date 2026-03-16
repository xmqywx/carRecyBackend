import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { OverseasPartsEntity } from '../entity/overseasParts';
import { OverseasVehicleEntity } from '../entity/overseasVehicle';
import { OverseasContainerEntity } from '../entity/overseasContainer';
import { CarEntity } from '../entity/base';

@Provide()
export class OverseasPartsService extends BaseService {
  @InjectEntityModel(OverseasPartsEntity)
  partsRepo: Repository<OverseasPartsEntity>;

  @InjectEntityModel(OverseasVehicleEntity)
  vehicleRepo: Repository<OverseasVehicleEntity>;

  @InjectEntityModel(OverseasContainerEntity)
  containerRepo: Repository<OverseasContainerEntity>;

  @InjectEntityModel(CarEntity)
  carRepo: Repository<CarEntity>;

  /**
   * Add a single part to a vehicle.
   * Auto-sets vehicleName from car table.
   * Auto-transitions vehicle stage ready → dismantling.
   * Refreshes vehicle partsCount.
   */
  async addPart(data: {
    carID: number;
    partName: string;
    category?: string;
    condition?: string;
    price?: number;
    weight?: number;
    notes?: string;
  }): Promise<OverseasPartsEntity> {
    const car = await this.carRepo.findOne({ where: { id: data.carID } });
    const vehicleName = car
      ? [car.year, car.brand, car.model].filter(Boolean).join(' ')
      : '';

    const part = await this.partsRepo.save({
      carID: data.carID,
      partName: data.partName,
      category: data.category || null,
      condition: data.condition || null,
      price: data.price || null,
      weight: data.weight || null,
      notes: data.notes || null,
      vehicleName,
    });

    // Auto-start dismantling
    const vehicle = await this.vehicleRepo.findOne({ where: { carID: data.carID } });
    if (vehicle && vehicle.stage === 'ready') {
      await this.vehicleRepo.update(vehicle.id, { stage: 'dismantling' });
    }

    await this.refreshVehiclePartsCount(data.carID);
    return part;
  }

  /**
   * Batch add multiple parts to a vehicle.
   */
  async batchAdd(carID: number, parts: Array<{
    partName: string;
    category?: string;
    condition?: string;
    price?: number;
    weight?: number;
    notes?: string;
  }>): Promise<OverseasPartsEntity[]> {
    const car = await this.carRepo.findOne({ where: { id: carID } });
    const vehicleName = car
      ? [car.year, car.brand, car.model].filter(Boolean).join(' ')
      : '';

    const entities = parts.map(p => ({
      carID,
      partName: p.partName,
      category: p.category || null,
      condition: p.condition || null,
      price: p.price || null,
      weight: p.weight || null,
      notes: p.notes || null,
      vehicleName,
    }));

    const saved = await this.partsRepo.save(entities);

    const vehicle = await this.vehicleRepo.findOne({ where: { carID } });
    if (vehicle && vehicle.stage === 'ready') {
      await this.vehicleRepo.update(vehicle.id, { stage: 'dismantling' });
    }

    await this.refreshVehiclePartsCount(carID);
    return saved;
  }

  /**
   * Batch assign parts to a container.
   */
  async batchAssignContainer(partIDs: number[], containerID: number): Promise<void> {
    if (!partIDs.length) return;
    await this.partsRepo
      .createQueryBuilder()
      .update()
      .set({ containerID })
      .whereInIds(partIDs)
      .execute();

    await this.refreshContainerStats(containerID);
  }

  /**
   * Unassign a part from its container.
   */
  async unassignFromContainer(partID: number): Promise<void> {
    const part = await this.partsRepo.findOne({ where: { id: partID } });
    if (!part || !part.containerID) return;

    const oldContainerID = part.containerID;
    await this.partsRepo.update(partID, { containerID: null });
    await this.refreshContainerStats(oldContainerID);
  }

  /**
   * Void (delete) a part. Refreshes vehicle and container counts.
   */
  async voidPart(partID: number): Promise<void> {
    const part = await this.partsRepo.findOne({ where: { id: partID } });
    if (!part) return;

    const { carID, containerID } = part;
    await this.partsRepo.delete(partID);

    await this.refreshVehiclePartsCount(carID);
    if (containerID) {
      await this.refreshContainerStats(containerID);
    }
  }

  /**
   * Refresh denormalized partsCount on overseas_vehicle.
   */
  async refreshVehiclePartsCount(carID: number): Promise<void> {
    const count = await this.partsRepo.count({ where: { carID, status: 0 } });
    await this.vehicleRepo
      .createQueryBuilder()
      .update()
      .set({ partsCount: count })
      .where('carID = :carID', { carID })
      .execute();
  }

  /**
   * Refresh denormalized stats on overseas_container from overseas_parts.
   */
  async refreshContainerStats(containerID: number): Promise<void> {
    const result = await this.partsRepo
      .createQueryBuilder('p')
      .select('COUNT(*)', 'cnt')
      .addSelect('COALESCE(SUM(p.price), 0)', 'totalValue')
      .addSelect('COALESCE(SUM(p.weight), 0)', 'totalWeight')
      .where('p.containerID = :containerID', { containerID })
      .andWhere('p.status = 0')
      .getRawOne();

    const container = await this.containerRepo.findOne({ where: { id: containerID } });
    if (!container) return;

    const loadedCount = parseInt(result.cnt) || 0;
    const capacity = container.capacity || 1;
    const loadingPercent = Math.min(Math.round((loadedCount / capacity) * 100), 100);

    await this.containerRepo.update(containerID, {
      loadedCount,
      loadingPercent,
      totalValue: parseFloat(result.totalValue) || 0,
      totalWeight: parseFloat(result.totalWeight) || 0,
    });
  }

  /**
   * Mark a single part as physically loaded into its container.
   */
  async markPartLoaded(partID: number): Promise<void> {
    await this.partsRepo.update(partID, { loaded: 1, loadedAt: new Date() });
    const part = await this.partsRepo.findOne({ where: { id: partID } });
    if (part?.containerID) {
      await this.refreshContainerStats(part.containerID);
    }
  }

  /**
   * Batch mark parts as loaded.
   */
  async batchMarkLoaded(partIDs: number[]): Promise<void> {
    if (!partIDs.length) return;
    await this.partsRepo
      .createQueryBuilder()
      .update()
      .set({ loaded: 1, loadedAt: new Date() })
      .whereInIds(partIDs)
      .execute();

    // Refresh all affected containers
    const parts = await this.partsRepo.findByIds(partIDs);
    const containerIDs = [...new Set(parts.map(p => p.containerID).filter(Boolean))];
    for (const cid of containerIDs) {
      await this.refreshContainerStats(cid!);
    }
  }

  /**
   * Get parts by container ID.
   */
  async getPartsByContainer(containerID: number): Promise<OverseasPartsEntity[]> {
    return this.partsRepo.find({
      where: { containerID, status: 0 },
      order: { id: 'ASC' },
    });
  }
}
