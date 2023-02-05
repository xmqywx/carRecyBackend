import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import {Column} from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('car_engine')
export class CarEngineEntity extends BaseEntity {
  @Column({ comment: 'Car ID', nullable: false })
  carID: number;

  @Column({ comment: 'yardID', nullable: true })
  yardID: number;

  @Column({ comment: 'QrCode', nullable: true, length: 100 })
  qrCode: string;

  @Column({ comment: 'Price', nullable: true, type:"decimal" })
  price: number;

  @Column({ comment: 'weight', nullable: true })
  engineSizeCc: number;
}
