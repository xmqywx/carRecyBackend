import { Provide, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { CustomerProfileEntity } from '../../entity/profile';

import { CustomerProfileService } from '../../service/profile';

/**
 * 客户信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CustomerProfileEntity,
  service: CustomerProfileService,

  pageQueryOp: {
    keyWordLikeFields: ['firstName', 'surname', 'emailAddress', 'phoneNumber'],
    fieldEq: [
      'firstName',
      'surname',
      'departmentId',
      'phoneNumber',
      'emailAddress',
      'isDel',
    ],
  },
})
export class CustomerProfileController extends BaseController {
  @Inject()
  customerProfileService: CustomerProfileService;
}
