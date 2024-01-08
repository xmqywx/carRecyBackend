import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column,ManyToOne,JoinColumn } from 'typeorm';
import { ContainerEntity } from './base';

/**
 * 系统用户
 */
@EntityModel('container_logs')
export class ContainerLogEntity extends BaseEntity {
  @Column({ comment: 'Container ID', nullable: false})
  containerID: number;

  @Column({ type: 'tinyint', comment: 'Are engines complete?', nullable: true})
  areEnginesComplete: boolean;

  @Column({ type: 'tinyint', comment: 'Are engines running well?', nullable: true})
  areEnginesRunningWell: boolean;

  @Column({ type: 'tinyint',comment: 'Any issues?', nullable: true})
  anyIssues: boolean;

  @Column({ comment: 'issues', length: 255, nullable: true})
  issues: string;

  @Column({ comment: 'Status change time', length: 255, nullable: true})
  statusChangeTime: string;

  @Column({ comment: 'Which status to go to', nullable: true})
  statusTo: number;

  @ManyToOne(type => ContainerEntity, container => container.logs)
  @JoinColumn({name: 'containerID'})
  container: ContainerEntity;
}
