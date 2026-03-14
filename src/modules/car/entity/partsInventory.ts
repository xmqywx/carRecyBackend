import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, Index } from 'typeorm';

/**
 * Parts Inventory — individual parts dismantled from vehicles.
 *
 * Each part has its own lifecycle: listed → dismantled → shelved → sold → closed
 * Linked to a source vehicle via carID.
 * Optionally linked to a container for overseas export via containerID.
 */
@EntityModel('parts_inventory')
export class PartsInventoryEntity extends BaseEntity {
  @Index()
  @Column({ comment: 'Source car ID' })
  carID: number;

  @Column({ comment: 'Part name (e.g. Front Bumper Assembly)' })
  partName: string;

  @Column({ comment: 'Part classification/category', nullable: true })
  category: string;

  @Column({ comment: 'Disassembly number / SKU', nullable: true })
  sku: string;

  @Column({ comment: 'Strip plan: keep | discard', length: 10, nullable: true })
  stripPlan: string;

  @Column({
    comment: 'Status: inventory | marketing | dismantling | shelving | sold | closed | void',
    length: 20,
    default: 'inventory',
  })
  status: string;

  @Column({
    comment: 'Condition: A=Excellent | B=Good | C=Fair | D=Poor',
    length: 2,
    nullable: true,
  })
  condition: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Listed price', nullable: true })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Sold price', nullable: true })
  soldPrice: number;

  @Column({ comment: 'Description / notes', nullable: true, type: 'text' })
  description: string;

  @Column({ comment: 'Color of the part', nullable: true })
  color: string;

  @Column({ type: 'text', comment: 'Images JSON array of URLs', nullable: true })
  images: string;

  @Column({ comment: 'QR code data or reference', nullable: true, type: 'text' })
  qrData: string;

  @Column({ comment: 'Weight (e.g. 12.5 kg)', nullable: true })
  weight: string;

  @Column({ comment: 'Storage location / shelf', nullable: true })
  location: string;

  @Column({ type: 'int', comment: 'Container ID for overseas export', nullable: true })
  containerID: number;

  @Column({ type: 'int', comment: 'Buyer ID', nullable: true })
  buyerID: number;

  @Column({ comment: 'Buyer name (denormalized for display)', nullable: true })
  buyerName: string;

  @Column({ comment: 'When part was dismantled', nullable: true })
  dismantledAt: Date;

  @Column({ comment: 'When shelved', nullable: true })
  shelvedAt: Date;

  @Column({ comment: 'When sold', nullable: true })
  soldAt: Date;

  @Column({ comment: 'Who dismantled', nullable: true })
  dismantledBy: string;

  @Column({ type: 'tinyint', comment: 'Part is complete: 0=No, 1=Yes', nullable: true })
  isComplete: number;

  @Column({ type: 'tinyint', comment: 'Engine turns over: 0=No, 1=Yes', nullable: true })
  turnsOver: number;

  @Column({ type: 'text', comment: 'Missing sub-parts description', nullable: true })
  missingParts: string;

  @Column({ type: 'tinyint', comment: 'Part removed from vehicle: 0=No, 1=Yes', default: 0 })
  removed: number;

  @Column({ comment: 'When part was removed from vehicle', nullable: true })
  removedAt: Date;
}
