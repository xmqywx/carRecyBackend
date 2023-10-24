import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('container')
export class ContainerEntity extends BaseEntity {
  @Column({ comment: 'Container number', length: 20})
  containerNumber: string;

  @Column({ comment: 'Seal number (lock number)', length: 20})
  sealNumber: string;
}
