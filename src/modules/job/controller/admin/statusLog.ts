import { Body, Post, Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/orm';
import { JobStatusLogEntity } from '../../entity/statusLog';
import { BaseSysUserEntity } from '../../../base/entity/sys/user';

/**
 * 任务状态日志
 */
@Provide()
@CoolController({
  api: ['add', 'info', 'list', 'page'],
  entity: JobStatusLogEntity,
  pageQueryOp: {
    keyWordLikeFields: ['action', 'description', 'operatorName', 'driverName'],
    select: [
      'a.*',
      'b.username as operatorUsername',
      'c.username as driverUsername',
    ],
    fieldEq: [
      { column: 'a.jobId', requestParam: 'jobId' },
      { column: 'a.orderId', requestParam: 'orderId' },
      { column: 'a.action', requestParam: 'action' },
      { column: 'a.operatorType', requestParam: 'operatorType' },
    ],
    join: [
      {
        entity: BaseSysUserEntity,
        alias: 'b',
        condition: 'a.operatorId = b.id',
        type: 'leftJoin',
      },
      {
        entity: BaseSysUserEntity,
        alias: 'c',
        condition: 'a.driverId = c.id',
        type: 'leftJoin',
      },
    ],
  },
  listQueryOp: {
    select: [
      'a.*',
      'b.username as operatorUsername',
      'c.username as driverUsername',
    ],
    fieldEq: [
      { column: 'a.jobId', requestParam: 'jobId' },
      { column: 'a.orderId', requestParam: 'orderId' },
      { column: 'a.action', requestParam: 'action' },
    ],
    join: [
      {
        entity: BaseSysUserEntity,
        alias: 'b',
        condition: 'a.operatorId = b.id',
        type: 'leftJoin',
      },
      {
        entity: BaseSysUserEntity,
        alias: 'c',
        condition: 'a.driverId = c.id',
        type: 'leftJoin',
      },
    ],
  },
})
export class JobStatusLogController extends BaseController {
  @InjectEntityModel(JobStatusLogEntity)
  jobStatusLogEntity: Repository<JobStatusLogEntity>;

  @Post('/getJobHistory')
  async getJobHistory(@Body('jobId') jobId: number) {
    try {
      const logs = await this.jobStatusLogEntity.find({
        where: { jobId },
        order: { createTime: 'DESC' },
      });
      return this.ok(logs);
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/getOrderHistory')
  async getOrderHistory(@Body('orderId') orderId: number) {
    try {
      const logs = await this.jobStatusLogEntity.find({
        where: { orderId },
        order: { createTime: 'DESC' },
      });
      return this.ok(logs);
    } catch (e) {
      return this.fail(e);
    }
  }
}
