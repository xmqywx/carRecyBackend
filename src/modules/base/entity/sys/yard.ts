import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, Index } from 'typeorm';

/**
 * 角色
 */
@EntityModel('base_sys_yard')
export class BaseSysYardEntity extends BaseEntity {
  @Index({ unique: true })
  @Column({ comment: '名称' })
  name: string;
}
