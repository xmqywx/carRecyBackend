import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 拆解分类
 */
@EntityModel('disassembly_category')
export class DisassemblyCategoryEntity extends BaseEntity {
  @Column({ comment: 'name', nullable: false })
  name: string;
}
