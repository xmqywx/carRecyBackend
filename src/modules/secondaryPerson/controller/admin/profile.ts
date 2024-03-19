import { Provide, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { SecondaryPersonEntity } from '../../entity/profile';

import { SecondaryPersonService } from '../../service/profile';

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: SecondaryPersonEntity,
  service: SecondaryPersonService,

  pageQueryOp: {
    keyWordLikeFields: ['a.*'],
    fieldEq: ['a.*'],
  },
})
export class SecondaryPersonController extends BaseController {
  @Inject()
  SecondaryPersonService: SecondaryPersonService;
}
