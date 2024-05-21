import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('order_action')
export class OrderActionEntity extends BaseEntity {
  @Column({ comment: 'timestamp', length: 50 })
  timestamp: string;

  @Column({ comment: 'name', length: 100, nullable: true })
  name: string;

  @Column({ comment: 'description', nullable: true })
  description: string;

  @Column({ comment: 'author' })
  authorID: number;

  @Column({ comment: 'orderID' })
  orderID: number;

  @Column({ comment: 'type', type: 'tinyint' })
  type: number;
}
