import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, Index } from 'typeorm';

/**
 * Overseas Vehicle — tracks vehicles destined for export dismantling.
 *
 * Stages: ready → dismantling → dismantled
 */
@EntityModel('overseas_vehicle')
export class OverseasVehicleEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: 'Car ID (references car table)' })
  carID: number;

  @Column({
    comment: 'Stage: ready | dismantling | dismantled',
    length: 20,
    default: 'ready',
  })
  stage: string;

  @Column({ comment: 'Destination country', nullable: true })
  destinationCountry: string;

  @Column({ comment: 'Destination city', nullable: true })
  destinationCity: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Estimated value', nullable: true })
  estValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Vehicle weight (kg)', nullable: true })
  weight: number;

  @Column({ type: 'int', comment: 'Denormalized parts count', default: 0 })
  partsCount: number;

  @Column({ type: 'text', comment: 'Notes', nullable: true })
  notes: string;

  @Column({ comment: 'When marked ready for export', nullable: true })
  readyAt: Date;

  @Column({ comment: 'When dismantling completed', nullable: true })
  dismantledAt: Date;
}
