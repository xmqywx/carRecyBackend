import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

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

  @Column({ comment: 'Price', nullable: true, type: "decimal" })
  price: number;

  @Column({ comment: 'engineSizeCc', nullable: true })
  engineSizeCc: number;

  // // 以下字段为新增 ==============
  // // 排量
  // @Column({ comment: 'Engine Displacement', nullable: true, type: 'decimal' })
  // engineDisplacement: number;

  // // 气缸数
  // @Column({ comment: 'Number of Cylinders', nullable: true })
  // numberOfCylinders: number;

  // // 最大功率
  // @Column({ comment: 'Maximum Power', nullable: true, type: 'decimal' })
  // maximumPower: number;

  // // 最大扭矩
  // @Column({ comment: 'Maximum Torque', nullable: true, type: 'decimal' })
  // maximumTorque: number;

  // // 燃油类型
  // @Column({ comment: 'Fuel Type', nullable: true })
  // fuelType: string;

  // // 缸径
  // @Column({ comment: 'Bore', nullable: true, type: 'decimal' })
  // bore: number;

  // // 行程
  // @Column({ comment: 'Stroke', nullable: true, type: 'decimal' })
  // stroke: number;

  // // 燃油经济性
  // @Column({ comment: 'Fuel Efficiency', nullable: true, type: 'decimal' })
  // fuelEfficiency: number;

  @Column({ comment: 'car', nullable: true})
  car: string;

}
