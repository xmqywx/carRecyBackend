import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 汽车零件表格
 */
@EntityModel('car_labels')
export class CarLabelsEntity extends BaseEntity {
  @Column({ comment: 'Car ID 汽车id', nullable: false })
  carID: number;

  @Column({
    comment: '名称',
    nullable: true
  })
  name: string;

  @Column({
    comment: '图片',
    nullable: true,
    type: 'text',
  })
  images: string;

  @Column({ comment: '描述', nullable: true })
  description: string;
}
