import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

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

  @Column({ comment: 'Price', nullable: true, type: "decimal" })
  price: number;

  // // 以下为新增============================
  // // 重量
  // @Column({ comment: 'Weight', nullable: true, type: 'decimal' })
  // weight: number;

  // // 尺寸
  // @Column({ comment: 'Dimensions', nullable: true })
  // dimensions: string;

  // // 催化剂类型
  // @Column({ comment: 'Catalyst Type', nullable: true })
  // catalystType: string;

  // // 空气流量
  // @Column({ comment: 'Air Flow Rate', nullable: true, type: 'decimal' })
  // airFlowRate: number;

  // // 点火温度
  // @Column({ comment: 'Ignition Temperature', nullable: true, type: 'decimal' })
  // ignitionTemperature: number;

  // // 净化率
  // @Column({ comment: 'Purification Efficiency', nullable: true, type: 'decimal' })
  // purificationEfficiency: number;

  @Column({ comment: 'car', nullable: true})
  car: string;
}
