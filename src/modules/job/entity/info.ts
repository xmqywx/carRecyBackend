import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 分配任务
 */
@EntityModel('job')
export class JobEntity extends BaseEntity {
  @Column({ comment: 'carID', nullable: true})
  orderID: number;

  @Column({ comment: 'driverID', nullable: true})
  driverID: number;

  @Column({ comment: 'yardID', nullable: true })
  yardID: number;

  @Column({ comment: 'status', type: "tinyint"})
  status: number;

  @Column({ comment: 'schedulerStart', nullable: true})
  schedulerStart: string;

  @Column({ comment: 'schedulerEnd',  nullable: true})
  schedulerEnd: string;

  @Column({ comment: '实际 start time', type: 'timestamp',  nullable: true})
  start: string;

  @Column({ comment: '实际 end time', type: 'timestamp',  nullable: true})
  end: string;

  @Column({ comment: 'isAccept', type: 'boolean',  default: false})
  isAccept: boolean;

  @Column({ comment: 'note',  nullable: true})
  note: string;
}
