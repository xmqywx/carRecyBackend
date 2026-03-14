import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * Processing Log — records every stage transition and significant event
 * in the vehicle processing pipeline for workflow history/audit trail.
 */
@EntityModel('processing_log')
export class ProcessingLogEntity extends BaseEntity {
  @Column({ comment: 'Car ID' })
  carID: number;

  @Column({ comment: 'Action type: stage_change | stage_back | complete | data_update', length: 30 })
  action: string;

  @Column({ comment: 'Previous stage', nullable: true, length: 20 })
  fromStage: string;

  @Column({ comment: 'New stage', nullable: true, length: 20 })
  toStage: string;

  @Column({ comment: 'Who performed this action', nullable: true })
  performedBy: string;

  @Column({ type: 'text', comment: 'Extra details JSON', nullable: true })
  details: string;
}
