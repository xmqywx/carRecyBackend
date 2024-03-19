import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';

import { BaseSysYardEntity } from '../../../entity/sys/yard';

/**
 * 系统用户
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: BaseSysYardEntity,
  listQueryOp: {
    // 多表关联，请求筛选字段与表字段不一致的情况
    fieldEq: ['name'],
  },
})
export class BaseSysYardController extends BaseController {}
