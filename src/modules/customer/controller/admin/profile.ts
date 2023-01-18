import {Provide} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import {CustomerProfileEntity} from "../../entity/profile";
import {Repository} from "typeorm";
import {InjectEntityModel} from "@midwayjs/orm";

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CustomerProfileEntity,

  pageQueryOp: {
    keyWordLikeFields: ['firstName', 'surname', 'email', 'phoneNumber'],
    fieldEq: ['firstName', 'surname'],
  },
})
export class CustomerProfileController extends BaseController {
  @InjectEntityModel(CustomerProfileEntity)
  customerProfileEntity: Repository<CustomerProfileEntity>
}
