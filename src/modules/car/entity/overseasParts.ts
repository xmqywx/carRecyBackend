import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, Index } from 'typeorm';

/**
 * Overseas Parts — individual parts dismantled from vehicles for export.
 *
 * Links vehicles to containers. Each part can be assigned to one container.
 * Also holds sales/transaction fields (sold, deposit, paid, collected, buyer).
 */
@EntityModel('overseas_parts')
export class OverseasPartsEntity extends BaseEntity {
  @Index()
  @Column({ comment: 'Source vehicle car ID' })
  carID: number;

  @Index()
  @Column({ type: 'int', comment: 'Container ID (null = unassigned)', nullable: true })
  containerID: number;

  @Column({ comment: 'Part name', length: 200 })
  partName: string;

  @Column({ comment: 'Category', length: 100, nullable: true })
  category: string;

  @Column({ comment: 'Condition: A, B, C, D', length: 1, nullable: true })
  condition: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Part price', nullable: true })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Part weight (kg)', nullable: true })
  weight: number;

  @Column({ type: 'text', comment: 'Notes', nullable: true })
  notes: string;

  @Column({ type: 'varchar', length: 500, comment: 'Photo URL', nullable: true })
  photo: string;

  @Column({ comment: 'Vehicle display name (denormalized)', length: 200, nullable: true })
  vehicleName: string;

  // ── Sales / Transaction fields ──

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  soldPrice: number;

  @Column({ nullable: true })
  soldDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  depositPrice: number;

  @Column({ nullable: true })
  depositDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  paidPrice: number;

  @Column({ nullable: true })
  paidDate: Date;

  @Column({ type: 'tinyint', comment: '0=not collected, 1=collected', default: 0 })
  collected: number;

  @Column({ nullable: true })
  collectedDate: Date;

  @Index()
  @Column({ type: 'int', comment: 'Buyer ID', nullable: true })
  buyerID: number;

  @Column({ comment: 'Buyer name (denormalized)', length: 200, nullable: true })
  buyerName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  discount: number;

  @Column({ type: 'tinyint', comment: '0=active, 1=canceled', default: 0 })
  status: number;

  @Column({ type: 'tinyint', comment: '0=not loaded, 1=physically loaded into container', default: 0 })
  loaded: number;

  @Column({ nullable: true })
  loadedAt: Date;

  @Column({ nullable: true })
  canceledDate: Date;
}
