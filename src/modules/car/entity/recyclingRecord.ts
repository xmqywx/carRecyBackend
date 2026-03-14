import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, Index } from 'typeorm';

/**
 * Recycling Record — vehicle shell processing after Parts dismantling.
 *
 * NOT a direct Decision destination. Created when a Parts Vehicle closes
 * with shellDestination = "Recycling".
 *
 * Supports batch operations: In Progress / Completed tabs.
 */
@EntityModel('recycling_record')
export class RecyclingRecordEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: 'Car ID (references car table)' })
  carID: number;

  @Column({
    comment: 'Status: in_progress | completed',
    length: 20,
    default: 'in_progress',
  })
  status: string;

  @Column({ comment: 'Source parts_vehicle ID', nullable: true })
  partsVehicleID: number;

  @Column({ comment: 'Vehicle weight', nullable: true })
  weight: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Recycling value', nullable: true })
  recyclingValue: number;

  @Column({ comment: 'Final destination after recycling: Scrap | Sold', length: 20, nullable: true })
  finalDestination: string;

  @Column({ comment: 'When processing started', nullable: true })
  startedAt: Date;

  @Column({ comment: 'When completed', nullable: true })
  completedAt: Date;

  @Column({ type: 'text', comment: 'Notes', nullable: true })
  notes: string;
}
