import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

@EntityModel('parts_label')
export class PartsLabelEntity extends BaseEntity {
  @Column({ comment: 'Label name' })
  name: string;

  @Column({ type: 'text', comment: 'Label description', nullable: true })
  description: string;

  @Column({ comment: 'Display color hex', length: 20, nullable: true })
  color: string;

  @Column({ type: 'int', comment: 'Sort order', default: 0 })
  sortOrder: number;

  @Column({ type: 'tinyint', comment: 'Is active: 0=No, 1=Yes', default: 1 })
  isActive: number;
}
