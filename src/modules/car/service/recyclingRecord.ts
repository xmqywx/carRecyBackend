import { Provide, Inject } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository, In } from 'typeorm';
import { RecyclingRecordEntity } from '../entity/recyclingRecord';
import { ScrapRecordService } from './scrapRecord';

const STAGES = ['received', 'weighed', 'scheduled', 'collected', 'certified', 'completed'];

@Provide()
export class RecyclingRecordService extends BaseService {
  @InjectEntityModel(RecyclingRecordEntity)
  recyclingRepo: Repository<RecyclingRecordEntity>;

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
}
