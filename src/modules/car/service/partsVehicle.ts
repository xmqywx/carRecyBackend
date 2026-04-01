import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { PartsVehicleEntity } from '../entity/partsVehicle';
import { InventoryEntity } from '../entity/inventory';
import { OrderInfoEntity } from '../../order/entity/info';

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

  @InjectEntityModel(InventoryEntity)
  inventoryRepo: Repository<InventoryEntity>;

  @InjectEntityModel(OrderInfoEntity)
  orderRepo: Repository<OrderInfoEntity>;

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
   * Refresh parts counts from inventory table.
   */
  async refreshCounts(carID: number): Promise<void> {
    const record = await this.partsVehicleRepo.findOne({ where: { carID } });
    if (!record) return;

    const allParts = await this.inventoryRepo.find({ where: { carID } });
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
  async addPart(data: Partial<InventoryEntity>): Promise<InventoryEntity> {
    // Save part first to get the auto-increment ID
    const part = await this.inventoryRepo.save({
      ...data,
      status: data.status || 'inventory',
    });

    // Auto-generate SKU: stockNumber-partId
    try {
      const order = await this.orderRepo.findOne({ where: { carID: part.carID } });
      const stockNum = order?.quoteNumber || `CAR${part.carID}`;
      part.sku = `${stockNum}-${part.id}`;
      await this.inventoryRepo.update(part.id, { sku: part.sku });
    } catch (e) {
      // Fallback SKU if order not found
      part.sku = `P${part.carID}-${part.id}`;
      await this.inventoryRepo.update(part.id, { sku: part.sku });
    }

    await this.refreshCounts(part.carID);
    return part;
  }

  /**
   * Add multiple parts in batch for a car.
   */
  async addPartsBatch(carID: number, parts: Partial<InventoryEntity>[]): Promise<InventoryEntity[]> {
    const results: InventoryEntity[] = [];
    for (const data of parts) {
      const part = await this.addPart({ ...data, carID });
      results.push(part);
    }
    return results;
  }

  /**
   * Update a part.
   */
  async updatePart(id: number, data: Partial<InventoryEntity>): Promise<void> {
    const part = await this.inventoryRepo.findOne({ where: { id } });
    if (!part) throw new Error(`Part ${id} not found`);

    delete (data as any).id;
    await this.inventoryRepo.update(id, data);
    await this.refreshCounts(part.carID);
  }

  /**
   * Change part status.
   */
  async changePartStatus(id: number, status: string): Promise<void> {
    const part = await this.inventoryRepo.findOne({ where: { id } });
    if (!part) throw new Error(`Part ${id} not found`);

    const update: any = { status };
    if (status === 'dismantling') update.dismantledAt = new Date();
    if (status === 'shelving') update.shelvedAt = new Date();
    if (status === 'sold') update.soldAt = new Date();

    await this.inventoryRepo.update(id, update);
    await this.refreshCounts(part.carID);
  }

  /**
   * Get all parts for a car.
   */
  async getPartsByCarID(carID: number): Promise<InventoryEntity[]> {
    return this.inventoryRepo.find({ where: { carID }, order: { id: 'ASC' } });
  }

  /**
   * Get parts by status (across all cars).
   */
  async getPartsByStatus(status: string): Promise<InventoryEntity[]> {
    return this.inventoryRepo.find({ where: { status }, order: { id: 'DESC' } });
  }

  /**
   * Void (soft-delete) a part.
   */
  async voidPart(id: number): Promise<void> {
    const part = await this.inventoryRepo.findOne({ where: { id } });
    if (!part) throw new Error(`Part ${id} not found`);

    await this.inventoryRepo.update(id, { status: 'void' });
    await this.refreshCounts(part.carID);
  }
}
