import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 任务
 */
@EntityModel('job_task')
export class JobTaskEntity extends BaseEntity {
  @Column({ comment: 'carID' })
  orderID: number;

  @Column({ comment: 'carID' })
  jobID: number;

  @Column({ comment: 'yardID', nullable: true })
  yardID: number;

  @Column({ comment: 'driverID', nullable: true })
  driverID: string;

  /**
   * 0 未开始
   * 1 已经完成
   * 2 中途出现问题，任务失败
   */
  @Column({ comment: 'status', type: 'tinyint' })
  status: number;

  @Column({ comment: 'signature', nullable: true })
  signature: string;

  @Column({ comment: 'photos', nullable: true })
  photos: string;

  @Column({ comment: 'note', nullable: true })
  note: string;
}
