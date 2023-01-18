import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('address')
export class AddressInfoEntity extends BaseEntity {
  @Column({ comment: 'address info'})
  info: string;
  @Column({ comment: 'address info'})
  latitude: string;

  @Column({ comment: 'address info'})
  longitude: string;
}
