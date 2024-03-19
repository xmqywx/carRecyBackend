import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 拆解选项
 */
@EntityModel('disassembly_option')
export class DisassemblyOptionsEntity extends BaseEntity {
  @Column({ comment: 'name', nullable: false })
  name: string;

  @Column({ comment: 'category', nullable: false })
  category: number;

  @Column({
    comment: 'search description fields',
    nullable: true,
    type: 'json',
  })
  search_description_fields: [];

  @Column({ comment: 'options', nullable: true, type: 'json' })
  options: [];
}
