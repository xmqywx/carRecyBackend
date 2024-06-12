import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, ManyToOne, OneToMany } from 'typeorm';
import { CustomerProfileEntity } from '../../customer/entity/profile';
import { CarPartsEntity } from './carParts';

/**
 * 汽车表
 */
@EntityModel('car')
export class CarEntity extends BaseEntity {
  @Column({ comment: 'Customer ID', nullable: false })
  customerID: number;

  @ManyToOne(() => CustomerProfileEntity, target => target.car)
  theCustomer?: Promise<CustomerProfileEntity> | CustomerProfileEntity;

  @Column({ comment: 'Car name', nullable: true })
  name: string;

  @Column({ comment: 'year', nullable: true })
  year: number;

  @Column({ comment: 'brand', nullable: true })
  brand: string;

  @Column({ comment: 'model', nullable: true })
  model: string;

  @Column({ comment: 'colour', nullable: true })
  colour: string;

  @Column({ comment: 'image', nullable: true })
  image: string;

  @Column({ comment: 'vinNumber', nullable: true })
  vinNumber: string;

  @Column({ comment: 'Series', nullable: true })
  series: string;

  @Column({ comment: 'registrationNumber', nullable: true })
  registrationNumber: string;

  @Column({ comment: 'state', nullable: true })
  state: string;

  @Column({ comment: 'body Style', nullable: true })
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

  @Column({ comment: 'Car info', nullable: true, type: 'text' })
  carInfo: string;

  /**
   * 1. 已录入，未托运 2. 需要拆解 3. 已经拆解
   */
  @Column({ comment: 'status', type: 'tinyint', default: 1 })
  status: number;

  @Column({ comment: 'Plates returned', type: 'boolean', default: null })
  platesReturned: boolean;

  @Column({ comment: 'Registered', type: 'boolean', default: null })
  registered: boolean;

  @Column({ comment: 'identificationSighted', type: 'boolean', default: null })
  identificationSighted: boolean;

  @Column({ comment: '部门ID', type: 'bigint' })
  departmentId: number;

  @Column({ comment: '车辆分解信息', type: 'json', nullable: true })
  carWreckedInfo: {
    dismantlingLabels: string[];
    extraPartsExtract: string[];
    catalyticConverter: boolean;
    catalyticConverterNumber: string;
  };

  @Column({ comment: 'Vehicle for Parts标识', default: false })
  isVFP: boolean;

  @Column({ comment: 'Engine Code', nullable: true })
  engineCode: string;

  @Column({ comment: 'Recycling status', nullable: true, default: 'new' })
  recyclingStatus: string;

  @OneToMany(() => CarPartsEntity, (part) => part.car, {
    eager: true  // 自动加载关联的 CarPartsEntity
  })
  parts: CarPartsEntity[];

  @Column({ comment: 'stolenInfo', type: 'text', nullable: true })
  stolenInfo: string
}
