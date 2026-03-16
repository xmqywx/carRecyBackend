import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, Index } from 'typeorm';

/**
 * Scrap Record — vehicles sent to scrap metal recycling.
 *
 * Sources:
 *   - Decision: directly from Decision stage
 *   - Parts: vehicle shell after all parts dismantled
 *   - Recycling: after recycling processing
 *
 * Simple terminal record — no further stages.
 */
@EntityModel('scrap_record')
export class ScrapRecordEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: 'Car ID (references car table)' })
  carID: number;

  @Column({
    comment: 'Source: Decision | Parts | Recycling',
    length: 20,
  })
  source: string;

  @Column({
    comment: 'Status: pending | processed | closed',
    length: 20,
    default: 'pending',
  })
  status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Vehicle weight in kg', nullable: true })
  weight: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Scrap value received', nullable: true })
  scrapValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Estimated scrap value', nullable: true })
  estScrapValue: number;

  @Column({ comment: 'Scrap yard / processor name', nullable: true })
  processorName: string;

  @Column({ comment: 'Certificate of destruction number', nullable: true })
  codNumber: string;

  // Dealer info
  @Column({ comment: 'Scrap dealer name', nullable: true })
  dealerName: string;

  @Column({ comment: 'Dealer phone', nullable: true })
  dealerPhone: string;

  @Column({ comment: 'Pickup date', nullable: true })
  pickupDate: Date;

  @Column({ type: 'text', comment: 'Dealer notes', nullable: true })
  dealerNotes: string;

  // Actual payment
  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Actual weight in kg', nullable: true })
  actualWeight: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Price per kg', nullable: true })
  pricePerKg: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Cat converter sold amount', nullable: true })
  catConverterSold: number;

  // Timestamps
  @Column({ comment: 'Date processed', nullable: true })
  processedAt: Date;

  @Column({ comment: 'Date closed', nullable: true })
  closedAt: Date;

  @Column({ type: 'text', comment: 'Notes', nullable: true })
  notes: string;
}
