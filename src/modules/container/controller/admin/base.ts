import {Provide, Inject} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { Repository } from "typeorm";
import {InjectEntityModel} from "@midwayjs/orm";
import { ContainerEntity } from '../../entity/base';
import { ContainerService } from '../../service/base';

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: ContainerEntity,

  listQueryOp: {
    keyWordLikeFields: [],
    fieldEq: [],
  },

  pageQueryOp: {
    keyWordLikeFields: [],
    select: [
      'a.*',
    ],

  },
})
export class CarBaseController extends BaseController {
  @InjectEntityModel(ContainerEntity)
  containerEntity: Repository<ContainerEntity>

  @Inject()
  containerService: ContainerService;
}
