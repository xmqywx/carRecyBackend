import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * Part Classification — grouping categories for parts.
 * E.g. Body, Engine, Electrical, Interior, Suspension, Drivetrain, etc.
 */
@EntityModel('part_classification')
export class PartClassificationEntity extends BaseEntity {
  @Column({ comment: 'Classification name (e.g. Body, Engine, Electrical)' })
  name: string;

  @Column({ type: 'int', comment: 'Sort order', default: 0 })
  sortOrder: number;

  @Column({ type: 'tinyint', comment: 'Is active: 0=No, 1=Yes', default: 1 })
  isActive: number;
}
