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

  @Column({ comment: 'user name', length: 100 })
  surname: string;

  @Column({ comment: 'Email Address', length: 50, nullable: true })
  emailAddress: string;

  @Column({ comment: 'phone Number', length: 50, nullable: true })
  phoneNumber: string;

  @Column({ comment: 'address', length: 250, nullable: true })
  address: string;

  @Column({ comment: 'licence', length: 250, nullable: true })
  licence: string;

  @OneToMany(() => CarEntity, target => target.theCustomer, {
    eager: true
  })
  @JoinTable()
  car?: Promise<CarEntity[]> | CarEntity[]
}
