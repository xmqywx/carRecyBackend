import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('container')
export class ContainerEntity extends BaseEntity {
  @Column({ comment: 'Container number', length: 20, nullable: true})
  containerNumber: string;

  @Column({ comment: 'Seal number (lock number)', length: 20, nullable: true})
  sealNumber: string;

  @Column({ comment: 'Expected delivery time', length: 20})
  expectedDeliveryTime: string;

  @Column({ comment: 'status', type: 'tinyint'})
  status: number;

  @Column({ comment: 'Seal date', length: 20, nullable: true})
  sealDate: string;

  @Column({ comment: 'type', length: 20, nullable: true})
  type: string;
}
