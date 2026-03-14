import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, Index } from 'typeorm';

/**
 * Parts Vehicle — tracks a whole vehicle through the 6-stage Parts pipeline.
 *
 * Stages: inventory → marketing → dismantling → shelving → sold → closed
 *
 * Created when Decision confirms destination = "Parts".
 * One record per car (carID unique).
 * After closing, the vehicle shell goes to Recycling or Scrap.
 */
@EntityModel('parts_vehicle')
export class PartsVehicleEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: 'Car ID (references car table)' })
  carID: number;

  @Column({
    comment: 'Stage: inventory | marketing | dismantling | shelving | sold | closed',
    length: 20,
    default: 'inventory',
  })
  stage: string;

  @Column({ comment: 'Worker assigned to current stage', nullable: true })
  assignedTo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Total estimated parts value', nullable: true })
  estTotalValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: 'Total actual sold value', nullable: true })
  actualTotalValue: number;

  @Column({ type: 'int', comment: 'Total parts count', default: 0 })
  partsCount: number;

  @Column({ type: 'int', comment: 'Parts sold count', default: 0 })
  partsSold: number;

  @Column({ type: 'int', comment: 'Parts listed for sale count', default: 0 })
  partsListed: number;

  @Column({ comment: 'When entered inventory stage', nullable: true })
  inventoryAt: Date;

  @Column({ comment: 'When moved to marketing', nullable: true })
  marketingAt: Date;

  @Column({ comment: 'When moved to dismantling', nullable: true })
  dismantlingAt: Date;

  @Column({ comment: 'When moved to shelving', nullable: true })
  shelvingAt: Date;

  @Column({ comment: 'When all parts sold', nullable: true })
  soldAt: Date;

  @Column({ comment: 'When closed', nullable: true })
  closedAt: Date;

  @Column({
    comment: 'Shell destination after close: Recycling | Scrap',
    length: 20,
    nullable: true,
  })
  shellDestination: string;

  @Column({ type: 'text', comment: 'Notes', nullable: true })
  notes: string;
}
