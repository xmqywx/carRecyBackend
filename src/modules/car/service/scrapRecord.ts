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

  // Status flow: pending → processed → completed (closed = archived)
  private static readonly STATUS_ORDER = ['pending', 'processed', 'completed'];

  /**
   * Advance to next status.
   */
  async advanceStatus(carID: number): Promise<string> {
    const record = await this.scrapRecordRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No scrap record for car ${carID}`);

    const idx = ScrapRecordService.STATUS_ORDER.indexOf(record.status);
    if (idx < 0 || idx >= ScrapRecordService.STATUS_ORDER.length - 1) {
      throw new Error(`Cannot advance from status "${record.status}"`);
    }
    const next = ScrapRecordService.STATUS_ORDER[idx + 1];
    const extra: any = { status: next };
    if (next === 'processed') extra.processedAt = new Date();
    if (next === 'completed') extra.closedAt = new Date();
    await this.scrapRecordRepo.update(record.id, extra);
    return next;
  }

  /**
   * Batch set status for multiple cars.
   */
  async batchSetStatus(carIDs: number[], status: string): Promise<void> {
    if (!carIDs.length) return;
    const valid = [...ScrapRecordService.STATUS_ORDER, 'closed'];
    if (!valid.includes(status)) {
      throw new Error(`Invalid status "${status}"`);
    }
    const extra: any = { status };
    if (status === 'processed') extra.processedAt = new Date();
    if (status === 'completed' || status === 'closed') extra.closedAt = new Date();
    await this.scrapRecordRepo
      .createQueryBuilder()
      .update()
      .set(extra)
      .where('carID IN (:...carIDs)', { carIDs })
      .execute();
  }

  /**
   * Get stats.
   */
  async getStats(): Promise<any> {
    const records = await this.scrapRecordRepo.find();
    const nonClosed = records.filter(r => r.status !== 'closed' && r.status !== 'completed');
    return {
      totalVehicles: nonClosed.length,
      estTotalValue: nonClosed.reduce((s, r) => s + (Number(r.estScrapValue) || 0), 0),
      actualTotalReceived: records.reduce((s, r) => s + (Number(r.scrapValue) || 0), 0),
      pendingPayment: nonClosed
        .filter(r => r.status !== 'processed')
        .reduce((s, r) => s + (Number(r.estScrapValue) || 0), 0),
    };
  }
}
