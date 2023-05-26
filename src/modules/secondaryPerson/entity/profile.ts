import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import {Column, } from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('secondary_person_profile')
export class SecondaryPersonEntity extends BaseEntity {
  @Column({ comment: 'person meeting for the car', length: 100 })
  personName: string;

  @Column({ comment: 'person phone number', length: 20 })
  personPhone: string;

  @Column({ comment: 'person email address', length: 100 })
  personEmail: string;

  @Column({ comment: 'person driver license number', length: 50 })
  personLicense: string;

  @Column({ comment: 'person ABN number', length: 50 })
  personABN: string;

  @Column({ comment: 'person residential address', length: 200 })
  personAddress: string;

  @Column({ comment: 'person workshop or house', length: 100 })
  personLocation: string;

  @Column({ comment: 'authority of sale/relation to the car owner', length: 100 })
  personRelation: string;

  @Column({ comment: 'person secondary phone number', length: 20 })
  personSecNumber: string;
}
