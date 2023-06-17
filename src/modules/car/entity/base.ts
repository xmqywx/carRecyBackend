import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import {Column, ManyToOne} from 'typeorm';
import {CustomerProfileEntity} from "../../customer/entity/profile";

/**
 * 系统用户
 */
@EntityModel('car')
export class CarEntity extends BaseEntity {
  @Column({ comment: 'Customer ID', nullable: false })
  customerID: number;

  @Column({ comment: 'yardID', nullable: true })
  yardID: number;

  @ManyToOne(() => CustomerProfileEntity, target => target.car)
  theCustomer?: Promise<CustomerProfileEntity> | CustomerProfileEntity

  @Column({ comment: 'Car name', nullable: true, length: 100 })
  name: string;

  @Column({ comment: 'year', nullable: true})
  year: number;

  @Column({ comment: 'brand', length: 25, nullable: true })
  brand: string;

  @Column({ comment: 'model', length: 24, nullable: true })
  model: string;

  @Column({ comment: 'colour', length: 100, nullable: true })
  colour: string;

  @Column({ comment: 'image', nullable: true })
  image: string;

  @Column({ comment: 'vinNumber', length: 100, nullable: true })
  vinNumber: string;

  @Column({ comment: 'Series', length: 24, nullable: true })
  series: string;

  @Column({ comment: 'registrationNumber', length: 24, nullable: true })
  registrationNumber: string;

  @Column({ comment: 'state', length: 24, nullable: true })
  state: string;

  @Column({ comment: 'body Style', length: 254, nullable: true })
  bodyStyle: string;

  @Column({ comment: 'engine', nullable: true })
  engine: string;

  @Column({ comment: 'door number', nullable: true })
  doors: number;

  @Column({ comment: 'Seats number', nullable: true })
  seats: number;

  @Column({ comment: 'fuelType', type: 'tinyint', nullable: true })
  fuelType: number;

  @Column({ comment: 'engineSizeCc', nullable: true })
  engineSizeCc: number;

  @Column({ comment: 'cylinders', nullable: true })
  cylinders: number;

  @Column({ comment: 'Length', nullable: true })
  length: number;

  @Column({ comment: 'Width', nullable: true })
  width: number;

  @Column({ comment: 'Height', nullable: true })
  height: number;

  @Column({ comment: 'TareWeight', nullable: true })
  tareWeight: number;

  @Column({ comment: 'Car info', nullable: true, length: 10000 })
  carInfo: string;

  /**
   * 1. 已录入，未托运 2. 需要拆解 3. 已经拆解
   */
  @Column({ comment: 'status', type:'tinyint', default: 1 })
  status: number;

  @Column({ comment: 'Plates returned', type:'boolean', default: null })
  platesReturned: boolean;

  @Column({ comment: 'Registered', type:'boolean', default: null })
  registered: boolean;

  @Column({ comment: 'identificationSighted', type:'boolean', default: null })
  identificationSighted: boolean;

  @Column({ comment: '部门ID', type: 'bigint' })
  departmentId: number;

  @Column({ comment: '车辆分解信息', type: 'json', nullable: true  })
  CarWreckedInfo: {
    dismantlingLabels: string[];
    extraPartsExtract: string[];
    catalyticConverter: boolean;
  };

  @Column({ comment: '是否 Vehicle for Parts', default: false })
  isVFP: boolean;
}
