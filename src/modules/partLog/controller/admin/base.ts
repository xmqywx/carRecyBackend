import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { PartLogEntity } from '../../entity/base';

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: PartLogEntity,
  pageQueryOp: {
    fieldEq: [],
  },
})
export class PartLogController extends BaseController {}
