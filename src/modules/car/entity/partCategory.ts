import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * Part Category — master list of common part names.
 * Used to quickly select part names without typing each time.
 */
@EntityModel('part_category')
export class PartCategoryEntity extends BaseEntity {
  @Column({ comment: 'Part name (e.g. Front Bumper, Door LF, Engine)' })
  name: string;

  @Column({ type: 'int', comment: 'Sort order', default: 0 })
  sortOrder: number;

  @Column({ type: 'tinyint', comment: 'Is active: 0=No, 1=Yes', default: 1 })
  isActive: number;
}
