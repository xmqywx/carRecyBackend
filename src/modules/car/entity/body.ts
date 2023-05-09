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
  @Column({ comment: 'yardID', nullable: true })
  yardID: number;

  @Column({ comment: 'QrCode', nullable: true, length: 10000 })
  qrCode: string;

  @Column({ comment: 'Price', nullable: true, type:"decimal" })
  price: number;

  @Column({ comment: 'weight', nullable: true, type:"decimal" })
  weight: number;

  // @Column({ comment: 'weight', nullable: true, type:"decimal" })
  // unitPrice: number;
  // //以下为新增============================
  // //长度
  // @Column({ comment: 'Length', nullable: true, type:"decimal" })
  // length: number;
  // //宽度
  // @Column({ comment: 'Width', nullable: true, type:"decimal" })
  // width: number;
  // //高度
  // @Column({ comment: 'Height', nullable: true, type:"decimal" })
  // height: number;
  // //座位数
  // @Column({ comment: 'Seating Capacity', nullable: true, type:"decimal" })
  // seatingCapacity: number;
  // //轮胎尺寸
  // @Column({ comment: 'Tire Size', nullable: true})
  // tireSize: string;
  // //车身颜色
  // @Column({ comment: 'Body Color', nullable: true})
  // color: string;
  // //车身型号
  // @Column({ comment: 'Body Type', nullable: true})
  // bodyType: string;

  @Column({ comment: 'car', nullable: true})
  car: string;
}
