import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import {Column, } from 'typeorm';

/**
 * 系统用户
 */
@EntityModel('secondary_person_profile')
export class SecondaryPersonEntity extends BaseEntity {
  @Column({ comment: 'person meeting for the car', nullable: true  })
  personName: string;

  @Column({ comment: 'person phone number', nullable: true })
  personPhone: string;

  @Column({ comment: 'person email address', nullable: true  })
  personEmail: string;

  @Column({ comment: 'person driver license number', nullable: true  })
  personLicense: string;

  @Column({ comment: 'person ABN number', nullable: true  })
  personABN: string;

  @Column({ comment: 'person residential address',nullable: true })
  personAddress: string;

  @Column({ comment: 'person workshop or house',nullable: true })
  personLocation: string;

  @Column({ comment: 'authority of sale/relation to the car owner',nullable: true })
  personRelation: string;

  @Column({ comment: 'person secondary phone number',nullable: true  })
  personSecNumber: string;
}
