import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('car_reg')
export class CarRegEntity extends BaseEntity {
  @Column({ comment: 'RegistrationNumber', length: 20 })
  registrationNumber: string;

  @Column({ comment: 'state', length: 20 })
  state: string;

  @Column({ comment: 'xml', type: 'text', nullable: true })
  xml: string;

  @Column({ comment: 'json', type: 'json', nullable: true })
  json: any;

  @Column({ comment: 'json_v2', type: 'json', nullable: true })
  json_v2: any;

  @Column({ comment: 'json_v3', type: 'json', nullable: true })
  json_v3: any;
}
