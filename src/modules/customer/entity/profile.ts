import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, OneToMany, JoinTable } from 'typeorm';
import { CarEntity } from '../../car/entity/base';

/**
 * 系统用户
 */
@EntityModel('customer_profile')
export class CustomerProfileEntity extends BaseEntity {
  @Column({ comment: 'user name', length: 100 })
  firstName: string;

  @Column({ comment: 'surname', nullable: true, length: 100 })
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

  // ----------------
  @Column({ comment: 'ABN', nullable: true })
  abn: string;

  @Column({ comment: 'work location', nullable: true })
  workLocation: string;

  @OneToMany(() => CarEntity, target => target.theCustomer, {
    eager: true,
  })
  @JoinTable()
  car?: Promise<CarEntity[]> | CarEntity[];

  // -----------------
  // @Column({ comment: 'License Number', length: 50 })
  // licenseNumber: string;

  @Column({ comment: 'License Class', length: 20, nullable: true  })
  licenseClass: string;

  @Column({ comment: 'Card Number', length: 50, nullable: true  })
  cardNumber: string;

  @Column({ comment: 'Date of Birth', nullable: true  })
  dateOfBirth: string;

  @Column({ comment: 'Expiry Date', nullable: true  })
  expiryDate: string;

  @Column({ comment: 'Back Card Number', length: 50 , nullable: true })
  backCardNumber: string;
  // ---Private owner , Workshop
  @Column({ comment: 'If the vehicle is at a workshop or private owner', default: 'Private owner' })
  customerAt: string;
}
