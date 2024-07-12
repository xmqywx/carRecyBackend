import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 文件空间信息
 */
@EntityModel('part_transactions')
export class PartTransactionsEntity extends BaseEntity {
  @Column({ comment: 'Car Wrecked ID', nullable: false })
  carWreckedID: number;

  @Column({ comment: 'bill no.', nullable: true })
  billNo: string;

  @Column({
    type: 'decimal',
    comment: 'Sold Price',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  soldPrice: number;

  @Column({ type: 'datetime', comment: 'Sold Date', nullable: true })
  soldDate: Date;

  @Column({
    type: 'decimal',
    comment: 'Deposit Price',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  depositPrice: number;

  @Column({ type: 'datetime', comment: 'Deposit Date', nullable: true })
  depositDate: Date;

  @Column({
    type: 'decimal',
    comment: 'Paid Price',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  paidPrice: number;

  @Column({ type: 'datetime', comment: 'Paid Date', nullable: true })
  paidDate: Date;

  
  @Column({
    type: 'tinyint',
    comment: 'Collected 0 1 是否收集',
    default: false,
  })
  collected: number;

  @Column({ type: 'datetime', comment: 'Collected Date', nullable: true })
  collectedDate: Date;

  @Column({ comment: 'Buyer ID', nullable: true })
  buyerID: number;

  @Column({ type: 'tinyint', comment: '是否不生效；0生效 1不生效', default: 0 })
  status: number;

  @Column({ comment: 'Remarks', nullable: true })
  remarks: string;

  @Column({ type: 'datetime', comment: 'Canceled date', nullable: true })
  canceledDate: Date;

  @Column({
    type: 'decimal',
    comment: 'refund',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  refund: number;

  @Column({ comment: 'Collector ID', nullable: true })
  collectorID: number;
}
