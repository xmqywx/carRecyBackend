import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';
/**
 * 系统用户
 */
@EntityModel('container')
export class ContainerEntity extends BaseEntity {
  @Column({ comment: 'Container number', length: 255, nullable: true })
  containerNumber: string;

  @Column({ comment: 'Seal number (lock number)', length: 255, nullable: true })
  sealNumber: string;

  @Column({ comment: 'Start delivery time', length: 255 })
  startDeliverTime: string;

  @Column({ comment: 'status', type: 'tinyint' })
  status: number;

  @Column({ comment: 'Seal date', length: 255, nullable: true })
  sealDate: string;

  @Column({ comment: 'type', length: 255, nullable: true })
  type: string;

  @Column({ comment: 'container photos', nullable: true, type: 'text' })
  photo: string;

  @Column({ comment: '部门ID', type: 'bigint', nullable: true })
  departmentId: number;

  @Column({ comment: 'create by', nullable: true, type: 'tinyint' })
  createBy: number;

  @Column({ comment: 'Dispatch location 发出地', length: 255, nullable: true })
  dispatchLocation: string;

  @Column({
    comment: 'Final Destination 最终接收地址',
    length: 255,
    nullable: true,
  })
  finalDestination: string;

  @Column({
    comment: 'ETA arrival 到达时间',
    nullable: true,
  })
  etaArrival: string;

  @Column({ comment: 'Consignee ID 接收人信息', nullable: true })
  consigneeID: number;

  @Column({
    type: 'decimal',
    comment: 'Loading Cost 装载价格',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  loadingCost: number;

  @Column({
    type: 'decimal',
    comment: 'Unloading cost 卸载价格',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  unloadingCost: number;
}
