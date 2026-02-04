import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 任务状态日志
 */
@EntityModel('job_status_log')
export class JobStatusLogEntity extends BaseEntity {
  @Column({ comment: '任务ID' })
  jobId: number;

  @Column({ comment: '订单ID', nullable: true })
  orderId: number;

  @Column({ comment: '变更前状态', type: 'tinyint', nullable: true })
  fromStatus: number;

  @Column({ comment: '变更后状态', type: 'tinyint' })
  toStatus: number;

  @Column({ comment: '操作类型', length: 50 })
  action: string;

  @Column({ comment: '操作人ID', nullable: true })
  operatorId: number;

  @Column({ comment: '操作人名称', length: 100, nullable: true })
  operatorName: string;

  @Column({ comment: '操作人类型: admin/driver/system', length: 20, nullable: true })
  operatorType: string;

  @Column({ comment: '司机ID', nullable: true })
  driverId: number;

  @Column({ comment: '司机名称', length: 100, nullable: true })
  driverName: string;

  @Column({ comment: '描述/备注', type: 'text', nullable: true })
  description: string;

  @Column({ comment: '取消原因代码', type: 'tinyint', nullable: true })
  cancellationReason: number;

  @Column({ comment: '改期日期', nullable: true })
  rescheduledDate: string;
}
