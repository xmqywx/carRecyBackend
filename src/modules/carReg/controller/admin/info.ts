import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { Repository} from "typeorm";
import { InjectEntityModel } from "@midwayjs/orm";
import { CarRegEntity } from "../../entity/info";

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CarRegEntity,

  pageQueryOp: {
    keyWordLikeFields: ['name', 'year', 'model'],

    fieldEq: ['name', 'year']
  },
})
export class CarRegController extends BaseController {
  @InjectEntityModel(CarRegEntity)
  carRegEntity: Repository<CarRegEntity>
}
