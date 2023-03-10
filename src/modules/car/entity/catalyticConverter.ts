import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import {Column} from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('car_catalytic_converter')
export class CarCatalyticConverterEntity extends BaseEntity {
  @Column({ comment: 'Car ID', nullable: false })
  carID: number;

  @Column({ comment: 'yardID', nullable: true })
  yardID: number;

  @Column({ comment: 'QrCode', nullable: true, length: 100 })
  qrCode: string;

  @Column({ comment: 'Price', nullable: true, type:"decimal" })
  price: number;
}
