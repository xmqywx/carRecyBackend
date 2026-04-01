import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * Unified label definitions — shared across all modules.
 * Replaces parts_label and recycling_label.
 */
@EntityModel('label')
export class LabelEntity extends BaseEntity {
  @Column({ comment: 'Label name' })
  name: string;

  @Column({ comment: 'Description', type: 'text', nullable: true })
  description: string;

  @Column({ comment: 'Display color hex', nullable: true, length: 20 })
  color: string;

  @Column({ comment: 'Sort order', default: 0 })
  sortOrder: number;

  @Column({ comment: 'Is active', type: 'tinyint', default: 1 })
  isActive: number;
}
