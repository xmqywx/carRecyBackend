import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, Index } from 'typeorm';

/**
 * Unified vehicle-label assignment — links labels to cars.
 * Keyed by carID (not partsVehicleId/recyclingRecordId).
 * Labels follow the car across modules.
 */
@EntityModel('vehicle_label')
export class VehicleLabelEntity extends BaseEntity {
  @Index()
  @Column({ comment: 'Car ID' })
  carID: number;

  @Column({ comment: 'Label ID' })
  labelId: number;

  @Column({ comment: 'Label name (denormalized)', nullable: true })
  labelName: string;

  @Column({ comment: 'Description override', type: 'text', nullable: true })
  description: string;
}
