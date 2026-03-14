import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { ScrapRecordEntity } from '../entity/scrapRecord';

@Provide()
export class ScrapRecordService extends BaseService {
  @InjectEntityModel(ScrapRecordEntity)
  scrapRecordRepo: Repository<ScrapRecordEntity>;

  /**
   * Create scrap record.
   * Sources: "Decision" (direct from Decision), "Parts" (shell after dismantling), "Recycling"
   */
  async create(carID: number, source: string, estScrapValue?: number): Promise<ScrapRecordEntity> {
    let record = await this.scrapRecordRepo.findOne({ where: { carID } });
    if (record) return record;

    record = await this.scrapRecordRepo.save({
      carID,
      source,
      status: 'pending',
      estScrapValue,
    });
    return record;
  }

  /**
   * Get record by carID.
   */
  async getByCarID(carID: number): Promise<ScrapRecordEntity | undefined> {
    return this.scrapRecordRepo.findOne({ where: { carID } });
  }

  /**
   * Mark as processed.
   */
  async markProcessed(carID: number, data?: {
    scrapValue?: number;
    processorName?: string;
    codNumber?: string;
    weight?: string;
  }): Promise<void> {
    const record = await this.scrapRecordRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No scrap record for car ${carID}`);

    await this.scrapRecordRepo.update(record.id, {
      status: 'processed',
      processedAt: new Date(),
      ...data,
    });
  }

  /**
   * Close record.
   */
  async close(carID: number): Promise<void> {
    const record = await this.scrapRecordRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No scrap record for car ${carID}`);

    await this.scrapRecordRepo.update(record.id, {
      status: 'closed',
      closedAt: new Date(),
    });
  }

  /**
   * Update record fields.
   */
  async updateRecord(carID: number, data: Partial<ScrapRecordEntity>): Promise<void> {
    const record = await this.scrapRecordRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No scrap record for car ${carID}`);

    delete (data as any).id;
    delete (data as any).carID;
    await this.scrapRecordRepo.update(record.id, data);
  }
}
