import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 汽车零件表格
 */
@EntityModel('car_catalytic_converter')
export class CarCatalyticConverterEntity extends BaseEntity {
  @Column({ comment: 'Car ID 汽车id', nullable: false })
  carID: number;

  @Column({
    comment: 'Disassembly images 零件图片',
    nullable: true,
    type: 'text',
  })
  disassemblyImages: string;

  @Column({ comment: 'Disassembly number 编号', nullable: true })
  disassemblyNumber: string;

  @Column({
    comment: 'Catalytic Converter Name 催化转化器 名称',
    nullable: true,
  })
  catalyticConverterNumber: string;

  @Column({
    comment: 'Catalytic Converter Number 催化转化器 编号',
    nullable: true,
  })
  catalyticConverterName: string;

  @Column({ comment: 'Container ID 容器ID', nullable: true })
  containerID: number;

  @Column({
    type: 'decimal',
    comment: 'Component price 价格',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  price: number;

  @Column({
    type: 'decimal',
    comment: 'cc platinum 铂',
    nullable: true,
    precision: 16,
    scale: 6,
  })
  platinum: number;

  @Column({
    type: 'decimal',
    comment: 'cc palladium 钯',
    nullable: true,
    precision: 16,
    scale: 6,
  })
  palladium: number;

  @Column({
    type: 'decimal',
    comment: 'cc rhodium 铑',
    nullable: true,
    precision: 16,
    scale: 6,
  })
  rhodium: number;

  @Column({ comment: 'cc cat type 催化转化器类型 ', nullable: true })
  catType: string;

  @Column({
    comment: 'Location of catalytic converter 催化转化器的位置',
    nullable: true,
  })
  locationOfCat: string;

  @Column({ comment: 'Disassembly description 拆解描述', nullable: true })
  disassemblyDescription: string;
}
