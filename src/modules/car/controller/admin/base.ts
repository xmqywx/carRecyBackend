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
  listQueryOp: {
    keyWordLikeFields: ['name', 'year', 'departmentId'],
    fieldEq: ['name', 'year', 'customerID', 'departmentId'],
  },

  pageQueryOp: {
    keyWordLikeFields: ['name', 'year', 'departmentId'],
    fieldEq: ['name', 'year', 'customerID', 'departmentId'],
  },
})
export class CarBaseController extends BaseController {
  @InjectEntityModel(CarEntity)
  vehicleProfileEntity: Repository<CarEntity>
}
