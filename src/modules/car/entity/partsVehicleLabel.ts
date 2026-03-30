import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

@EntityModel('parts_vehicle_label')
export class PartsVehicleLabelEntity extends BaseEntity {
  @Column({ comment: 'Parts vehicle ID (references parts_vehicle.id)' })
  partsVehicleId: number;

  @Column({ comment: 'Label ID' })
  labelId: number;

  @Column({ comment: 'Label name (denormalized)', nullable: true })
  labelName: string;

  @Column({ type: 'text', comment: 'Description override for this vehicle', nullable: true })
  description: string;
}
