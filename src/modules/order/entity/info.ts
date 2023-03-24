import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('order')
export class OrderInfoEntity extends BaseEntity {
  @Column({ comment: 'carID', nullable: true})
  carID: number;

  @Column({ comment: 'yardID', nullable: true })
  yardID: number;

  @Column({ comment: 'customer'})
  customerID: string;

  @Column({ comment: 'driverID', nullable: true})
  driverID: string;

  @Column({ comment: 'status', type: "tinyint"})
  status: number;

  @Column({ comment: 'OverrideEmailAddress',  nullable: true})
  overrideEmailAddress: string;

  @Column({ comment: 'pickupAddress',  nullable: true})
  pickupAddress: string;

  @Column({ comment: 'pickupAddress state',  nullable: true})
  pickupAddressState: string;

  @Column({ comment: 'payMethod',  nullable: true})
  payMethod: string;

  @Column({ comment: 'overridePhoneNumber',  nullable: true})
  overridePhoneNumber: string;

  @Column({ comment: 'recommendedPrice', type:"decimal",  nullable: true, default: 0})
  recommendedPrice: string;

  @Column({ comment: 'ActualPaymentPrice', type:"decimal",  nullable: true})
  actualPaymentPrice: string;

  @Column({ comment: 'expectedDate', length: 20,  nullable: true})
  expectedDate: string;

  @Column({ comment: 'note',  nullable: true})
  note: string;

  @Column({ comment: '部门ID', type: 'bigint' })
  departmentId: number;

  @Column({ type: 'tinyint', nullable: true })
  gotPapers: boolean;

  @Column({ type: 'tinyint', nullable: true })
  gotKey: boolean;

  @Column({ type: 'tinyint', nullable: true })
  gotOwner: boolean;

  @Column({ type: 'tinyint', nullable: true })
  gotRunning: boolean;

  @Column({ type: 'tinyint', nullable: true })
  gotLicense: boolean;

  @Column({ type: 'tinyint', nullable: true })
  gotFlat: boolean;

  @Column({ type: 'tinyint', nullable: true })
  gotEasy: boolean;

  @Column({ type: 'tinyint', nullable: true })
  gotBusy: boolean;
}
