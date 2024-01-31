import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column} from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('buyer')
export class BuyerEntity extends BaseEntity {
  @Column({ comment: 'Name', nullable: false})
  name: string;

  @Column({ comment: 'Phone', nullable: true})
  phone: number;

  @Column({ comment: 'Address', nullable: false})
  address: string;
}
