import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 发动机
 */
@EntityModel('car_engine')
export class CarEngineEntity extends BaseEntity {
  @Column({ comment: 'Car ID', nullable: false })
  carID: number;

  @Column({ comment: 'yardID', nullable: true })
  yardID: number;

  @Column({ comment: 'QrCode', nullable: true, length: 100 })
  qrCode: string;

  @Column({ comment: 'Price', nullable: true, type: 'decimal' })
  price: number;

  @Column({ comment: 'engineSizeCc', nullable: true })
  engineSizeCc: number;

  @Column({ comment: 'car', nullable: true })
  car: string;
}
