import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, Index } from 'typeorm';

/**
 * Unified parts inventory — used by Parts, Recycling, and any module that tracks dismantled parts.
 * Replaces both parts_inventory and recycling_inventory (identical schemas).
 * Parts follow the car via carID; car.currentModule determines which module sees them.
 */
@EntityModel('inventory')
export class InventoryEntity extends BaseEntity {
  @Index()
  @Column({ comment: 'Source car ID' })
  carID: number;

  @Column({ comment: 'Part name' })
  partName: string;

  @Column({ comment: 'Category', nullable: true })
  category: string;

  @Column({ comment: 'SKU / disassembly number', nullable: true })
  sku: string;

  @Column({ comment: 'Strip plan: keep | discard', nullable: true, length: 10 })
  stripPlan: string;

  @Column({ comment: 'Status', length: 20, default: 'inventory' })
  status: string;

  @Column({ comment: 'Condition: A|B|C|D', nullable: true, length: 2 })
  condition: string;

  @Column({ comment: 'Listed price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  @Column({ comment: 'Sold price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  soldPrice: number;

  @Column({ comment: 'Description', type: 'text', nullable: true })
  description: string;

  @Column({ comment: 'Part color', nullable: true })
  color: string;

  @Column({ comment: 'Images JSON', type: 'text', nullable: true })
  images: string;

  @Column({ comment: 'QR data', type: 'text', nullable: true })
  qrData: string;

  @Column({ comment: 'Weight', nullable: true })
  weight: string;

  @Column({ comment: 'Storage location', nullable: true })
  location: string;

  @Column({ comment: 'Container ID for export', nullable: true })
  containerID: number;

  @Column({ comment: 'Buyer ID', nullable: true })
  buyerID: number;

  @Column({ comment: 'Buyer name', nullable: true })
  buyerName: string;

  @Column({ comment: 'Dismantled timestamp', nullable: true })
  dismantledAt: Date;

  @Column({ comment: 'Shelved timestamp', nullable: true })
  shelvedAt: Date;

  @Column({ comment: 'Sold timestamp', nullable: true })
  soldAt: Date;

  @Column({ comment: 'Dismantled by', nullable: true })
  dismantledBy: string;

  @Column({ comment: 'Part complete', type: 'tinyint', nullable: true })
  isComplete: number;

  @Column({ comment: 'Engine turns over', type: 'tinyint', nullable: true })
  turnsOver: number;

  @Column({ comment: 'Missing sub-parts', type: 'text', nullable: true })
  missingParts: string;

  @Column({ comment: 'Part removed from vehicle', type: 'tinyint', default: 0 })
  removed: number;

  @Column({ comment: 'Removed timestamp', nullable: true })
  removedAt: Date;
}
