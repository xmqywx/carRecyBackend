import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import {Column, OneToMany, JoinTable} from 'typeorm';
import {CarEntity} from "../../car/entity/base";

/**
 * 系统用户
 */
@EntityModel('customer_profile')
export class CustomerProfileEntity extends BaseEntity {
  @Column({ comment: 'user name', length: 100 })
  firstName: string;

  @Column({ comment: 'yardID', nullable: true })
  yardID: number;

  @Column({ comment: 'surname',  nullable: true, length: 100 })
  surname: string;

  @Column({ comment: 'Email Address', length: 50, nullable: true })
  emailAddress: string;

  @Column({ comment: 'phone Number', length: 50, nullable: true })
  phoneNumber: string;

  @Column({ comment: 'Secondary phone Number', length: 50, nullable: true })
  secNumber: string;

  @Column({ comment: 'address', length: 250, nullable: true })
  address: string;

  @Column({ comment: 'licence', length: 250, nullable: true })
  licence: string;

  @Column({ comment: '部门ID', type: 'bigint' })
  departmentId: number;

  @Column({ comment: '是否刪除', default: false })
  isDel: boolean;

  @OneToMany(() => CarEntity, target => target.theCustomer, {
    eager: true
  })
  @JoinTable()
  car?: Promise<CarEntity[]> | CarEntity[]
}
