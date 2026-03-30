import { Provide, Inject } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository, In } from 'typeorm';
import { RecyclingRecordEntity } from '../entity/recyclingRecord';
import { RecyclingInventoryEntity } from '../entity/recyclingInventory';
import { OrderInfoEntity } from '../../order/entity/info';
import { ScrapRecordService } from './scrapRecord';

const STAGES = ['received', 'weighed', 'scheduled', 'collected', 'certified', 'completed'];

@Provide()
export class RecyclingRecordService extends BaseService {
  @InjectEntityModel(RecyclingRecordEntity)
  recyclingRepo: Repository<RecyclingRecordEntity>;

  @InjectEntityModel(RecyclingInventoryEntity)
  recyclingInventoryRepo: Repository<RecyclingInventoryEntity>;

  @InjectEntityModel(OrderInfoEntity)
  orderRepo: Repository<OrderInfoEntity>;

  @Inject()
  scrapRecordService: ScrapRecordService;

  /**
   * Create recycling record (from Decision stage — direct recycling destination).
   */
  async createFromDecision(carID: number): Promise<RecyclingRecordEntity> {
    let record = await this.recyclingRepo.findOne({ where: { carID } });
    if (record) return record;

    record = await this.recyclingRepo.save({
      carID,
      stage: 'received',
      archived: 0,
      startedAt: new Date(),
    });
    return record;
  }

  /**
   * Create recycling record (from Parts vehicle shell).
   */
  async createFromParts(carID: number, partsVehicleID?: number): Promise<RecyclingRecordEntity> {
    let record = await this.recyclingRepo.findOne({ where: { carID } });
    if (record) return record;

    record = await this.recyclingRepo.save({
      carID,
      stage: 'received',
      archived: 0,
      partsVehicleID,
      startedAt: new Date(),
    });
    return record;
  }

  /**
   * Advance to next stage in the pipeline.
   */
  async advanceStage(carID: number): Promise<string> {
    const record = await this.recyclingRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No recycling record for car ${carID}`);

    const idx = STAGES.indexOf(record.stage);
    if (idx < 0 || idx >= STAGES.length - 1) {
      throw new Error(`Cannot advance from stage: ${record.stage}`);
    }

    const nextStage = STAGES[idx + 1];
    const update: any = { stage: nextStage };
    if (nextStage === 'completed') {
      update.completedAt = new Date();
    }

    await this.recyclingRepo.update(record.id, update);
    return nextStage;
  }

  /**
   * Set stage directly (for bulk status change).
   */
  async setStage(carID: number, stage: string): Promise<void> {
    if (!STAGES.includes(stage)) throw new Error(`Invalid stage: ${stage}`);

    const record = await this.recyclingRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No recycling record for car ${carID}`);

    const update: any = { stage };
    if (stage === 'completed') update.completedAt = new Date();

    await this.recyclingRepo.update(record.id, update);
  }

  /**
   * Batch set stage for multiple vehicles.
   */
  async batchSetStage(carIDs: number[], stage: string): Promise<void> {
    if (!STAGES.includes(stage)) throw new Error(`Invalid stage: ${stage}`);
    if (carIDs.length === 0) return;

    const records = await this.recyclingRepo.find({ where: { carID: In(carIDs) } });
    const ids = records.map(r => r.id);
    if (ids.length === 0) return;

    const update: any = { stage };
    if (stage === 'completed') update.completedAt = new Date();

    await this.recyclingRepo
      .createQueryBuilder()
      .update()
      .set(update)
      .whereInIds(ids)
      .execute();
  }

  /**
   * Archive a single record.
   */
  async archive(carID: number): Promise<void> {
    const record = await this.recyclingRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No recycling record for car ${carID}`);

    await this.recyclingRepo.update(record.id, {
      archived: 1,
      archivedAt: new Date(),
    });
  }

  /**
   * Batch archive by carIDs.
   */
  async batchArchive(carIDs: number[]): Promise<void> {
    if (carIDs.length === 0) return;
    const records = await this.recyclingRepo.find({ where: { carID: In(carIDs) } });
    const ids = records.map(r => r.id);
    if (ids.length === 0) return;

    await this.recyclingRepo
      .createQueryBuilder()
      .update()
      .set({ archived: 1, archivedAt: new Date() })
      .whereInIds(ids)
      .execute();
  }

  /**
   * Archive all completed records in one go.
   */
  async archiveCompleted(): Promise<number> {
    const result = await this.recyclingRepo
      .createQueryBuilder()
      .update()
      .set({ archived: 1, archivedAt: new Date() })
      .where('stage = :stage', { stage: 'completed' })
      .andWhere('archived = 0')
      .execute();
    return result.affected || 0;
  }

  /**
   * Get summary stats for the footer bar.
   */
  async getStats(): Promise<{
    todayCount: number;
    inProgress: number;
    completed: number;
    totalWeight: number;
    totalValue: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Count non-archived by stage
    const qb = this.recyclingRepo.createQueryBuilder('r');
    const stageCounts = await qb
      .select('r.stage', 'stage')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.archived = 0')
      .groupBy('r.stage')
      .getRawMany();

    let inProgress = 0;
    let completed = 0;
    for (const row of stageCounts) {
      if (row.stage === 'completed') completed = Number(row.cnt);
      else inProgress += Number(row.cnt);
    }

    // Today's count (created today, non-archived)
    const todayCount = await this.recyclingRepo
      .createQueryBuilder('r')
      .where('r.archived = 0')
      .andWhere('r.createTime >= :today', { today })
      .getCount();

    // Total weight and value (non-archived)
    const totals = await this.recyclingRepo
      .createQueryBuilder('r')
      .select('SUM(CAST(REPLACE(r.weight, " kg", "") AS DECIMAL(10,2)))', 'totalWeight')
      .addSelect('SUM(IFNULL(r.recyclingValue, 0))', 'totalValue')
      .where('r.archived = 0')
      .getRawOne();

    return {
      todayCount,
      inProgress,
      completed,
      totalWeight: Number(totals?.totalWeight) || 0,
      totalValue: Number(totals?.totalValue) || 0,
    };
  }

  /**
   * Update record fields.
   */
  async updateRecord(carID: number, data: Partial<RecyclingRecordEntity>): Promise<void> {
    const record = await this.recyclingRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No recycling record for car ${carID}`);

    delete (data as any).id;
    delete (data as any).carID;
    await this.recyclingRepo.update(record.id, data);
  }

  // ===== Parts Pipeline =====

  private static PARTS_STAGES = ['inventory', 'marketing', 'dismantling', 'shelving', 'sold', 'closed'];

  /**
   * Move vehicle to a parts pipeline stage.
   */
  async moveToPartsStage(carID: number, targetStage: string): Promise<void> {
    if (!RecyclingRecordService.PARTS_STAGES.includes(targetStage)) {
      throw new Error(`Invalid parts stage: ${targetStage}`);
    }
    const record = await this.recyclingRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No recycling record for car ${carID}`);

    await this.recyclingRepo.update(record.id, { partsStage: targetStage });
  }

  /**
   * Refresh parts counts from recycling_inventory table.
   */
  async refreshCounts(carID: number): Promise<void> {
    const record = await this.recyclingRepo.findOne({ where: { carID } });
    if (!record) return;

    const allParts = await this.recyclingInventoryRepo.find({ where: { carID } });
    const partsCount = allParts.filter(p => p.status !== 'void').length;
    const partsSold = allParts.filter(p => p.status === 'sold' || p.status === 'closed').length;
    const partsListed = allParts.filter(p => p.status === 'marketing').length;

    await this.recyclingRepo.update(record.id, { partsCount, partsSold, partsListed });
  }

  // ===== Parts Inventory CRUD =====

  /**
   * Add a part to recycling inventory for a car.
   * Auto-generates SKU from stock number (order.quoteNumber) + part ID.
   */
  async addPart(data: Partial<RecyclingInventoryEntity>): Promise<RecyclingInventoryEntity> {
    const part = await this.recyclingInventoryRepo.save({
      ...data,
      status: data.status || 'inventory',
    });

    // Auto-generate SKU: stockNumber-partId
    try {
      const order = await this.orderRepo.findOne({ where: { carID: part.carID } });
      const stockNum = order?.quoteNumber || `CAR${part.carID}`;
      part.sku = `R-${stockNum}-${part.id}`;
      await this.recyclingInventoryRepo.update(part.id, { sku: part.sku });
    } catch (e) {
      part.sku = `R${part.carID}-${part.id}`;
      await this.recyclingInventoryRepo.update(part.id, { sku: part.sku });
    }

    await this.refreshCounts(part.carID);
    return part;
  }

  /**
   * Add multiple parts in batch for a car.
   */
  async addPartsBatch(carID: number, parts: Partial<RecyclingInventoryEntity>[]): Promise<RecyclingInventoryEntity[]> {
    const results: RecyclingInventoryEntity[] = [];
    for (const data of parts) {
      const part = await this.addPart({ ...data, carID });
      results.push(part);
    }
    return results;
  }

  /**
   * Update a part.
   */
  async updatePart(id: number, data: Partial<RecyclingInventoryEntity>): Promise<void> {
    const part = await this.recyclingInventoryRepo.findOne({ where: { id } });
    if (!part) throw new Error(`Part ${id} not found`);

    delete (data as any).id;
    await this.recyclingInventoryRepo.update(id, data);
    await this.refreshCounts(part.carID);
  }

  /**
   * Change part status.
   */
  async changePartStatus(id: number, status: string): Promise<void> {
    const part = await this.recyclingInventoryRepo.findOne({ where: { id } });
    if (!part) throw new Error(`Part ${id} not found`);

    const update: any = { status };
    if (status === 'dismantling') update.dismantledAt = new Date();
    if (status === 'shelving') update.shelvedAt = new Date();
    if (status === 'sold') update.soldAt = new Date();

    await this.recyclingInventoryRepo.update(id, update);
    await this.refreshCounts(part.carID);
  }

  /**
   * Get all parts for a car.
   */
  async getPartsByCarID(carID: number): Promise<RecyclingInventoryEntity[]> {
    return this.recyclingInventoryRepo.find({ where: { carID }, order: { id: 'ASC' } });
  }

  /**
   * Void (soft-delete) a part.
   */
  async voidPart(id: number): Promise<void> {
    const part = await this.recyclingInventoryRepo.findOne({ where: { id } });
    if (!part) throw new Error(`Part ${id} not found`);

    await this.recyclingInventoryRepo.update(id, { status: 'void' });
    await this.refreshCounts(part.carID);
  }
}
