import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * Catalytic Converter每日价格表
 */
@EntityModel('catalytic_converter_price')
export class CarCatalyticConverterEntity extends BaseEntity {
  @Column({
    type: 'decimal',
    comment: 'cc platinum price',
    nullable: true,
    precision: 12,
    scale: 2,
  })
  platinumPrice: number;

  @Column({
    type: 'decimal',
    comment: 'cc palladium price',
    nullable: true,
    precision: 12,
    scale: 2,
  })
  palladiumPrice: number;

  @Column({
    type: 'decimal',
    comment: 'cc rhodium price',
    nullable: true,
    precision: 12,
    scale: 2,
  })
  rhodiumPrice: number;
}
