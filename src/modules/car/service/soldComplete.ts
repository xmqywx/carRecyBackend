import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { SoldCompleteEntity } from '../entity/soldComplete';

@Provide()
export class SoldCompleteService extends BaseService {
  @InjectEntityModel(SoldCompleteEntity)
  soldCompleteRepo: Repository<SoldCompleteEntity>;

  /**
   * Create sold complete record (called when Decision → Sold Complete).
   */
  async createFromDecision(carID: number): Promise<SoldCompleteEntity> {
    let record = await this.soldCompleteRepo.findOne({ where: { carID } });
    if (record) return record;

    record = await this.soldCompleteRepo.save({
      carID,
      status: 'pending',
    });
    return record;
  }

  /**
   * Get record by carID.
   */
  async getByCarID(carID: number): Promise<SoldCompleteEntity | undefined> {
    return this.soldCompleteRepo.findOne({ where: { carID } });
  }

  /**
   * Step 2: Save buyer details.
   */
  async saveBuyerDetails(carID: number, data: {
    customerID?: number;
    buyerName?: string;
    buyerCompany?: string;
    buyerPhone?: string;
    buyerEmail?: string;
    buyerAddress?: string;
    buyerABN?: string;
    priceExGST?: number;
    gstAmount?: number;
    totalAmount?: number;
    gstApplicable?: number;
    payMethod?: string;
  }): Promise<void> {
    const record = await this.soldCompleteRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No sold-complete record for car ${carID}`);

    await this.soldCompleteRepo.update(record.id, {
      ...data,
      status: 'buyer_entered',
    });
  }

  /**
   * Step 3: Generate invoice.
   */
  async generateInvoice(carID: number, invoiceNumber: string): Promise<void> {
    const record = await this.soldCompleteRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No sold-complete record for car ${carID}`);

    await this.soldCompleteRepo.update(record.id, {
      status: 'invoiced',
      invoiceNumber,
      invoiceDate: new Date(),
    });
  }

  /**
   * Record email sent.
   */
  async markEmailSent(carID: number): Promise<void> {
    const record = await this.soldCompleteRepo.findOne({ where: { carID } });
    if (!record) return;

    await this.soldCompleteRepo.update(record.id, {
      emailSent: 1,
      emailSentAt: new Date(),
    });
  }

  /**
   * Mark as paid.
   */
  async markPaid(carID: number, payMethod?: string): Promise<void> {
    const record = await this.soldCompleteRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No sold-complete record for car ${carID}`);

    await this.soldCompleteRepo.update(record.id, {
      status: 'paid',
      paymentStatus: 'paid',
      payMethod: payMethod || record.payMethod,
    });
  }

  /**
   * Close the sale.
   */
  async close(carID: number): Promise<void> {
    const record = await this.soldCompleteRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No sold-complete record for car ${carID}`);

    await this.soldCompleteRepo.update(record.id, { status: 'closed' });
  }

  /**
   * Update record fields.
   */
  async updateRecord(carID: number, data: Partial<SoldCompleteEntity>): Promise<void> {
    const record = await this.soldCompleteRepo.findOne({ where: { carID } });
    if (!record) throw new Error(`No sold-complete record for car ${carID}`);

    delete (data as any).id;
    delete (data as any).carID;
    await this.soldCompleteRepo.update(record.id, data);
  }
}
