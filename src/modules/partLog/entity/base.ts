import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 文件空间信息
 */
@EntityModel('part_log')
export class PartLogEntity extends BaseEntity {
  @Column({ comment: 'Car Wrecked ID', nullable: false })
  carWreckedID: number;

  @Column({
    comment: 'Previous Value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  previousValue: number;

  @Column({
    comment: 'Current Value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  currentValue: number;

  @Column({ comment: 'Change Type', nullable: false })
  changeType: string;

  @Column({ comment: 'Changed By', nullable: false })
  changedBy: number;
}
