import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 部门
 */
@EntityModel('base_sys_department')
export class BaseSysDepartmentEntity extends BaseEntity {
  @Column({ comment: '部门名称' })
  name: string;

  @Column({ comment: '上级部门ID', type: 'bigint', nullable: true })
  parentId: number;

  @Column({ comment: '排序', default: 0 })
  orderNum: number;
  // 父菜单名称
  parentName: string;
  
  @Column({ comment: 'Logo', nullable: true, type: 'text' })
  logo: string;

  @Column({ comment: 'Company name', nullable: true })
  companyName: string;

  @Column({ comment: 'Email', nullable: true })
  email: string;

  @Column({ comment: 'ABN', nullable: true })
  abn: string;

  @Column({ comment: 'Address', nullable: true, type: 'text' })
  address: string;

  @Column({ comment: 'Phone number', nullable: true })
  phoneNumber: string;

  @Column({ comment: 'Default state', nullable: true })
  state: string;
}

