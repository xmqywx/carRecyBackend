import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * Recycling Vehicle Label — many-to-many join between recycling records and labels.
 */
@EntityModel('recycling_vehicle_label')
export class RecyclingVehicleLabelEntity extends BaseEntity {
  @Column({ comment: 'Recycling record ID' })
  recyclingRecordId: number;

  @Column({ comment: 'Label ID' })
  labelId: number;

  @Column({ comment: 'Label name (denormalized for query convenience)', nullable: true })
  labelName: string;

  @Column({ type: 'text', comment: 'Description override for this vehicle (defaults to label description)', nullable: true })
  description: string;
}
