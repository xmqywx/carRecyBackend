import { Provide, Inject } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { PartsVehicleEntity } from '../entity/partsVehicle';
import { PartsInventoryEntity } from '../entity/partsInventory';
import { CarEntity } from '../entity/base';
import { OrderInfoEntity } from '../../order/entity/info';
import { ScrapRecordService } from './scrapRecord';
import { RecyclingRecordService } from './recyclingRecord';

const STAGE_ORDER = ['inventory', 'marketing', 'dismantling', 'shelving', 'sold', 'closed'];
const STAGE_TIMESTAMP: Record<string, string> = {
  inventory: 'inventoryAt',
  marketing: 'marketingAt',
  dismantling: 'dismantlingAt',
  shelving: 'shelvingAt',
  sold: 'soldAt',
  closed: 'closedAt',
};

@Provide()
export class PartsVehicleService extends BaseService {
  @InjectEntityModel(PartsVehicleEntity)
  partsVehicleRepo: Repository<PartsVehicleEntity>;

  @InjectEntityModel(PartsInventoryEntity)
  partsInventoryRepo: Repository<PartsInventoryEntity>;

  @InjectEntityModel(CarEntity)
  carRepo: Repository<CarEntity>;

  @InjectEntityModel(OrderInfoEntity)
  orderRepo: Repository<OrderInfoEntity>;

  @Inject()
  scrapRecordService: ScrapRecordService;

  @Inject()
  recyclingRecordService: RecyclingRecordService;

  /**
   * Create a parts vehicle record (called when Decision → Parts).
   */
  async createFromDecision(carID: number): Promise<PartsVehicleEntity> {
    let record = await this.partsVehicleRepo.findOne({ where: { carID } });
    if (record) return record;

    record = await this.partsVehicleRepo.save({
      carID,
      stage: 'inventory',
      inventoryAt: new Date(),
    });
    return record;
  }

  /**
   * Get record by carID.
   */
  async getByCarID(carID: number): Promise<PartsVehicleEntity | undefined> {
    return this.partsVehicleRepo.findOne({ where: { carID } });
  }

  /**
   * Move vehicle to the next stage.
   */
  async moveToStage(carID: number, targetStage: string, assignedTo?: string): Promise<void> {
    const record = await this.partsVehicleRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No parts record for car ${carID}`);

    const tsField = STAGE_TIMESTAMP[targetStage];
    const update: any = { stage: targetStage };
    if (tsField) update[tsField] = new Date();
    if (assignedTo !== undefined) update.assignedTo = assignedTo;

    await this.partsVehicleRepo.update(record.id, update);
  }

  /**
   * Move vehicle back to the previous stage.
   */
  async moveBack(carID: number): Promise<string> {
    const record = await this.partsVehicleRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No parts record for car ${carID}`);

    const idx = STAGE_ORDER.indexOf(record.stage);
    if (idx <= 0) throw new Error(`Cannot move back from stage "${record.stage}"`);

    const prevStage = STAGE_ORDER[idx - 1];
    await this.partsVehicleRepo.update(record.id, { stage: prevStage });
    return prevStage;
  }

  /**
   * Close vehicle — set shell destination (Recycling or Scrap).
   * Auto-creates downstream record based on shellDestination.
   */
  async close(carID: number, shellDestination: string): Promise<void> {
    const record = await this.partsVehicleRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No parts record for car ${carID}`);

    await this.partsVehicleRepo.update(record.id, {
      stage: 'closed',
      closedAt: new Date(),
      shellDestination,
    });

    // Auto-create downstream record
    if (shellDestination === 'Scrap') {
      await this.scrapRecordService.create(carID, 'Parts');
    } else if (shellDestination === 'Recycling') {
      await this.recyclingRecordService.createFromParts(carID, record.id);
    }
  }

  /**
   * Refresh parts counts from parts_inventory table.
   */
  async refreshCounts(carID: number): Promise<void> {
    const record = await this.partsVehicleRepo.findOne({ where: { carID } });
    if (!record) return;

    const allParts = await this.partsInventoryRepo.find({ where: { carID } });
    const partsCount = allParts.filter(p => p.status !== 'void').length;
    const partsSold = allParts.filter(p => p.status === 'sold' || p.status === 'closed').length;
    const partsListed = allParts.filter(p => p.status === 'marketing').length;

    await this.partsVehicleRepo.update(record.id, { partsCount, partsSold, partsListed });
  }

  // ===== Parts Inventory CRUD =====

  /**
   * Add a part to inventory for a car.
   * Auto-generates SKU from stock number (order.quoteNumber) + part ID.
   */
  async addPart(data: Partial<PartsInventoryEntity>): Promise<PartsInventoryEntity> {
    // Save part first to get the auto-increment ID
    const part = await this.partsInventoryRepo.save({
      ...data,
      status: data.status || 'inventory',
    });

    // Auto-generate SKU: stockNumber-partId
    try {
      const order = await this.orderRepo.findOne({ where: { carID: part.carID } });
      const stockNum = order?.quoteNumber || `CAR${part.carID}`;
      part.sku = `${stockNum}-${part.id}`;
      await this.partsInventoryRepo.update(part.id, { sku: part.sku });
    } catch (e) {
      // Fallback SKU if order not found
      part.sku = `P${part.carID}-${part.id}`;
      await this.partsInventoryRepo.update(part.id, { sku: part.sku });
    }

    await this.refreshCounts(part.carID);
    return part;
  }

  /**
   * Add multiple parts in batch for a car.
   */
  async addPartsBatch(carID: number, parts: Partial<PartsInventoryEntity>[]): Promise<PartsInventoryEntity[]> {
    const results: PartsInventoryEntity[] = [];
    for (const data of parts) {
      const part = await this.addPart({ ...data, carID });
      results.push(part);
    }
    return results;
  }

  /**
   * Update a part.
   */
  async updatePart(id: number, data: Partial<PartsInventoryEntity>): Promise<void> {
    const part = await this.partsInventoryRepo.findOne({ where: { id } });
    if (!part) throw new Error(`Part ${id} not found`);

    delete (data as any).id;
    await this.partsInventoryRepo.update(id, data);
    await this.refreshCounts(part.carID);
  }

  /**
   * Change part status.
   */
  async changePartStatus(id: number, status: string): Promise<void> {
    const part = await this.partsInventoryRepo.findOne({ where: { id } });
    if (!part) throw new Error(`Part ${id} not found`);

    const update: any = { status };
    if (status === 'dismantling') update.dismantledAt = new Date();
    if (status === 'shelving') update.shelvedAt = new Date();
    if (status === 'sold') update.soldAt = new Date();

    await this.partsInventoryRepo.update(id, update);
    await this.refreshCounts(part.carID);
  }

  /**
   * Get all parts for a car.
   */
  async getPartsByCarID(carID: number): Promise<PartsInventoryEntity[]> {
    return this.partsInventoryRepo.find({ where: { carID }, order: { id: 'ASC' } });
  }

  /**
   * Get parts by status (across all cars).
   */
  async getPartsByStatus(status: string): Promise<PartsInventoryEntity[]> {
    return this.partsInventoryRepo.find({ where: { status }, order: { id: 'DESC' } });
  }

  /**
   * Void (soft-delete) a part.
   */
  async voidPart(id: number): Promise<void> {
    const part = await this.partsInventoryRepo.findOne({ where: { id } });
    if (!part) throw new Error(`Part ${id} not found`);

    await this.partsInventoryRepo.update(id, { status: 'void' });
    await this.refreshCounts(part.carID);
  }
}
