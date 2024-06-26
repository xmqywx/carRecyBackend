import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 买家表
 */
@EntityModel('buyer')
export class BuyerEntity extends BaseEntity {
  @Column({ comment: 'Name', nullable: false })
  name: string;

  @Column({ comment: 'Phone', nullable: true, type: 'varchar', length: 20 })
  phone: string;

  @Column({ comment: 'Address', nullable: false })
  address: string;

  @Column({
    comment: 'Type: Buyer = 0, Consignee = 1, 收货人 = 2',
    type: 'tinyint',
    nullable: false,
    default: 0,
  })
  type: number;
}
