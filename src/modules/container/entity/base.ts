import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column, OneToMany } from 'typeorm';
import { ContainerLogEntity } from './container-logs';
/**
 * 系统用户
 */
@EntityModel('container')
export class ContainerEntity extends BaseEntity {
  @Column({ comment: 'Container number', length: 255, nullable: true})
  containerNumber: string;

  @Column({ comment: 'Seal number (lock number)', length: 255, nullable: true})
  sealNumber: string;

  @Column({ comment: 'Start delivery time', length: 255})
  startDeliverTime: string;

  @Column({ comment: 'status', type: 'tinyint'})
  status: number;

  @Column({ comment: 'Seal date', length: 255, nullable: true})
  sealDate: string;

  @Column({ comment: 'type', length: 255, nullable: true})
  type: string;

  @Column({ comment: 'container photos', nullable: true, type: 'text'})
  photo: string;

  @Column({ comment: '部门ID', type: 'bigint' })
  departmentId: number;

  @Column({ comment: 'create by', nullable: true, type: "tinyint" })
  createBy: number;

  @OneToMany(type => ContainerLogEntity, log => log.container)
  logs: ContainerLogEntity[];
}
