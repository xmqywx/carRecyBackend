import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, Index } from 'typeorm';

/**
 * Sold Complete — whole-vehicle sale record.
 *
 * 3-step wizard: Vehicle Confirm → Buyer Details → Invoice & Send
 *
 * Created when Decision confirms destination = "Sold Complete".
 */
@EntityModel('sold_complete')
export class SoldCompleteEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: 'Car ID (references car table)' })
  carID: number;

  @Column({
    comment: 'Status: pending | buyer_entered | invoiced | paid | closed',
    length: 20,
    default: 'pending',
  })
  status: string;

  // Buyer info
  @Column({ type: 'int', comment: 'Customer ID (references customer_profile)', nullable: true })
  customerID: number;

  @Column({ comment: 'Buyer full name', nullable: true })
  buyerName: string;

  @Column({ comment: 'Buyer company', nullable: true })
  buyerCompany: string;

  @Column({ comment: 'Buyer phone', nullable: true })
  buyerPhone: string;

  @Column({ comment: 'Buyer email', nullable: true })
  buyerEmail: string;

  @Column({ type: 'text', comment: 'Buyer address', nullable: true })
  buyerAddress: string;

  @Column({ comment: 'Buyer ABN', nullable: true })
  buyerABN: string;

  // Pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Sale price ex GST', nullable: true })
  priceExGST: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'GST amount', nullable: true })
  gstAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Total amount inc GST', nullable: true })
  totalAmount: number;

  @Column({ type: 'tinyint', comment: 'GST applicable: 0=No, 1=Yes', default: 1 })
  gstApplicable: number;

  @Column({ comment: 'Payment method', nullable: true })
  payMethod: string;

  @Column({ comment: 'Payment status: unpaid | deposit | paid', length: 20, nullable: true })
  paymentStatus: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Deposit amount', nullable: true })
  depositAmount: number;

  // Invoice
  @Column({ comment: 'Invoice number (e.g. INV-2026-0247)', nullable: true })
  invoiceNumber: string;

  @Column({ comment: 'Invoice date', nullable: true })
  invoiceDate: Date;

  @Column({ type: 'text', comment: 'Invoice PDF URL', nullable: true })
  invoicePdfUrl: string;

  // Email
  @Column({ type: 'tinyint', comment: 'Email sent: 0=No, 1=Yes', default: 0 })
  emailSent: number;

  @Column({ comment: 'Email sent date', nullable: true })
  emailSentAt: Date;

  @Column({ type: 'text', comment: 'Notes', nullable: true })
  notes: string;
}
