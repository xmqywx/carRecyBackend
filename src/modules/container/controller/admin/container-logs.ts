import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';

import { ContainerLogEntity } from '../../entity/container-logs';

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: ContainerLogEntity,
})
export class ContainerLogController extends BaseController {}
