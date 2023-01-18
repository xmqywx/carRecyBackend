import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import {Column} from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('car_body')
export class CarBodyEntity extends BaseEntity {
  @Column({ comment: 'Car ID', nullable: false })
  carID: number;

  @Column({ comment: 'QrCode', nullable: true, length: 100 })
  qrCode: string;

  @Column({ comment: 'Price', nullable: true, type:"decimal" })
  price: number;

  @Column({ comment: 'weight', nullable: true, type:"decimal" })
  weight: number;

  @Column({ comment: 'weight', nullable: true, type:"decimal" })
  unitPrice: number;
}
