import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, Index } from 'typeorm';

/**
 * Overseas Vehicle — tracks vehicles/parts destined for export.
 *
 * Stages: ready → assigned → loaded → closed
 *
 * Created when Decision confirms destination = "Overseas".
 * Links to overseas_container for container assignment.
 */
@EntityModel('overseas_vehicle')
export class OverseasVehicleEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: 'Car ID (references car table)' })
  carID: number;

  @Column({
    comment: 'Stage: ready | assigned | loaded | closed',
    length: 20,
    default: 'ready',
  })
  stage: string;

  @Column({ type: 'int', comment: 'Container ID (overseas_container)', nullable: true })
  containerID: number;

  @Column({ comment: 'Destination country', nullable: true })
  destinationCountry: string;

  @Column({ comment: 'Destination city', nullable: true })
  destinationCity: string;

  @Column({ type: 'int', comment: 'Consignee / Buyer ID', nullable: true })
  consigneeID: number;

  @Column({ comment: 'Consignee name (denormalized)', nullable: true })
  consigneeName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Estimated value', nullable: true })
  estValue: number;

  @Column({ comment: 'Vehicle weight', nullable: true })
  weight: string;

  @Column({ type: 'int', comment: 'Number of parts included', default: 0 })
  partsCount: number;

  @Column({ comment: 'When marked ready for export', nullable: true })
  readyAt: Date;

  @Column({ comment: 'When assigned to container', nullable: true })
  assignedAt: Date;

  @Column({ comment: 'When loaded into container', nullable: true })
  loadedAt: Date;

  @Column({ comment: 'When closed/shipped', nullable: true })
  closedAt: Date;

  @Column({ type: 'text', comment: 'Notes', nullable: true })
  notes: string;
}
