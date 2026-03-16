import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, Index } from 'typeorm';

/**
 * Recycling Record — 6-stage vehicle shell processing pipeline.
 *
 * Workflow: received → weighed → scheduled → collected → certified → completed
 * After completed, vehicles can be archived.
 *
 * Created when a Parts Vehicle closes with shellDestination = "Recycling".
 */
@EntityModel('recycling_record')
export class RecyclingRecordEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: 'Car ID (references car table)' })
  carID: number;

  @Column({
    comment: 'Stage: received | weighed | scheduled | collected | certified | completed',
    length: 20,
    default: 'received',
  })
  stage: string;

  @Column({ type: 'tinyint', comment: 'Whether archived', default: 0 })
  archived: number;

  @Column({ comment: 'Source parts_vehicle ID', nullable: true })
  partsVehicleID: number;

  @Column({ comment: 'Vehicle weight in kg', nullable: true })
  weight: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Recycling/scrap value', nullable: true })
  recyclingValue: number;

  @Column({ comment: 'Destination: Scrap | Sims Metal | Pick-n-Pull', length: 30, nullable: true })
  finalDestination: string;

  @Column({ comment: 'When vehicle was received (entered recycling)', nullable: true })
  startedAt: Date;

  @Column({ comment: 'When processing completed', nullable: true })
  completedAt: Date;

  @Column({ comment: 'When archived', nullable: true })
  archivedAt: Date;

  @Column({ type: 'date', comment: 'Scheduled pickup date', nullable: true })
  pickupDate: string;

  @Column({ type: 'text', comment: 'Notes', nullable: true })
  notes: string;
}
