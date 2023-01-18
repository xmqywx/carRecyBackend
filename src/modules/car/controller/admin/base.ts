import {Provide} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import {CarEntity} from "../../entity/base";
import {Repository} from "typeorm";
import {InjectEntityModel} from "@midwayjs/orm";

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CarEntity,

  pageQueryOp: {
    keyWordLikeFields: ['name', 'year'],
    fieldEq: ['name', 'year', 'customerID'],
  },
})
export class CarBaseController extends BaseController {
  @InjectEntityModel(CarEntity)
  vehicleProfileEntity: Repository<CarEntity>
}
