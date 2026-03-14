import { Provide, Inject } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository, In } from 'typeorm';
import { RecyclingRecordEntity } from '../entity/recyclingRecord';
import { ScrapRecordService } from './scrapRecord';

@Provide()
export class RecyclingRecordService extends BaseService {
  @InjectEntityModel(RecyclingRecordEntity)
  recyclingRepo: Repository<RecyclingRecordEntity>;

  @Inject()
  scrapRecordService: ScrapRecordService;

  /**
   * Create recycling record (from Parts vehicle shell).
   */
  async createFromParts(carID: number, partsVehicleID?: number): Promise<RecyclingRecordEntity> {
    let record = await this.recyclingRepo.findOne({ where: { carID } });
    if (record) return record;

    record = await this.recyclingRepo.save({
      carID,
      status: 'in_progress',
      partsVehicleID,
      startedAt: new Date(),
    });
    return record;
  }

  /**
   * Mark as completed.
   * Auto-creates scrapRecord if finalDestination is 'Scrap'.
   */
  async complete(carID: number, finalDestination?: string): Promise<void> {
    const record = await this.recyclingRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No recycling record for car ${carID}`);

    await this.recyclingRepo.update(record.id, {
      status: 'completed',
      completedAt: new Date(),
      finalDestination,
    });

    // Auto-create scrap record if final destination is Scrap
    if (finalDestination === 'Scrap') {
      await this.scrapRecordService.create(carID, 'Recycling');
    }
  }

  /**
   * Batch update status (for bulk operations).
   */
  async batchUpdateStatus(carIDs: number[], status: string): Promise<void> {
    if (carIDs.length === 0) return;
    const records = await this.recyclingRepo.find({ where: { carID: In(carIDs) } });
    const ids = records.map(r => r.id);
    if (ids.length === 0) return;

    const update: any = { status };
    if (status === 'completed') update.completedAt = new Date();

    await this.recyclingRepo
      .createQueryBuilder()
      .update()
      .set(update)
      .whereInIds(ids)
      .execute();
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
