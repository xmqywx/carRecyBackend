import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 汽车零件表格
 */
@EntityModel('car_wrecked')
export class CarWreckedEntity extends BaseEntity {
  @Column({ comment: 'Car ID 汽车id', nullable: false })
  carID: number;

  @Column({
    comment: 'Disassembling information 零件名称',
    nullable: true,
    type: 'text',
  })
  disassmblingInformation: string;

  @Column({ comment: 'Disassembly description 拆解描述', nullable: true })
  disassemblyDescription: string;

  @Column({
    comment: 'Disassembly images 零件图片',
    nullable: true,
    type: 'text',
  })
  disassemblyImages: string;

  @Column({ comment: 'Disassembly category 分类', nullable: true })
  disassemblyCategory: string;

  @Column({ comment: 'Disassembly number 编号', nullable: true })
  disassemblyNumber: string;

  @Column({
    comment: 'Catalytic Converter Name 催化转化器 名称',
    nullable: true,
  })
  catalyticConverterName: string;

  @Column({
    comment: 'Catalytic Converter Number 催化转化器 编号',
    nullable: true,
  })
  catalyticConverterNumber: string;

  // @Column({ comment: 'Container Number 容器Number', nullable: true })
  // containerNumber: string;

  @Column({ comment: 'Container ID 容器ID', nullable: true })
  containerID: number;

  @Column({ comment: 'Components description 零件描述', nullable: true })
  description: string;

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

  @Column({ comment: 'content of components 内容', nullable: true })
  contentOfComponents: string;

  @Column({ comment: 'cc cat type 催化转化器类型 ', nullable: true })
  catType: string;

  @Column({
    comment: 'Location of catalytic converter 催化转化器的位置',
    nullable: true,
  })
  locationOfCat: string;

  // ---------------------------

  @Column({
    type: 'decimal',
    comment: 'Sold 售价',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  sold: number;

  @Column({
    type: 'decimal',
    comment: 'Deposit押金 ',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  deposit: number;

  @Column({
    type: 'decimal',
    comment: 'Paid 支付价格',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  paid: number;

  @Column({
    type: 'tinyint',
    comment: 'Collected 0 1 是否收集',
    default: false,
  })
  collected: number;

  @Column({ comment: 'Buyer ID 买家id', nullable: true })
  buyerID: number;

  // ---------------------------

  @Column({ type: 'tinyint', comment: 'Complete 是否完整', nullable: true })
  complete: boolean;

  @Column({ type: 'tinyint', comment: 'Turns over 可转动', nullable: true })
  turnsOver: boolean;

  @Column({
    type: 'tinyint',
    comment: 'Missing parts 是否缺件',
    nullable: true,
  })
  missingParts: boolean;

  @Column({ comment: 'Collector ID 收集人id', nullable: true })
  collectorID: number;
}
