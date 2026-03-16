import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * Overseas Container — shipping container for export.
 *
 * Stages: ready | assigned | loaded | closed | delivered
 * Holds multiple vehicles/parts. Tracks loading progress.
 */
@EntityModel('overseas_container')
export class OverseasContainerEntity extends BaseEntity {
  @Column({ comment: 'Container number (e.g. CTN-2026-001)', unique: true })
  containerNumber: string;

  @Column({ comment: 'Seal number', nullable: true })
  sealNumber: string;

  @Column({
    comment: 'Status: ready | loading | sealed | sold | deposit | paid | collected',
    length: 20,
    default: 'ready',
  })
  status: string;

  @Column({ comment: 'Dispatch location', nullable: true })
  dispatchLocation: string;

  @Column({ comment: 'Final destination country', nullable: true })
  destinationCountry: string;

  @Column({ comment: 'Final destination city/port', nullable: true })
  destinationCity: string;

  @Column({ comment: 'ETA arrival date', nullable: true })
  etaArrival: Date;

  @Column({ type: 'int', comment: 'Consignee / Buyer ID', nullable: true })
  consigneeID: number;

  @Column({ comment: 'Consignee name (denormalized)', nullable: true })
  consigneeName: string;

  @Column({ type: 'int', comment: 'Total items capacity', nullable: true })
  capacity: number;

  @Column({ type: 'int', comment: 'Current items loaded', default: 0 })
  loadedCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, comment: 'Loading percentage', default: 0 })
  loadingPercent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Loading cost', nullable: true })
  loadingCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Unloading cost', nullable: true })
  unloadingCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Shipping cost', nullable: true })
  shippingCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Total value of contents', nullable: true })
  totalValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Total weight of parts (kg)', nullable: true })
  totalWeight: number;

  @Column({ type: 'text', comment: 'Photo URL', nullable: true })
  photo: string;

  @Column({ comment: 'Seal date', nullable: true })
  sealDate: Date;

  @Column({ comment: 'Dispatch date', nullable: true })
  dispatchDate: Date;

  @Column({ comment: 'Delivery date', nullable: true })
  deliveredDate: Date;

  @Column({ type: 'text', comment: 'Notes', nullable: true })
  notes: string;
}
