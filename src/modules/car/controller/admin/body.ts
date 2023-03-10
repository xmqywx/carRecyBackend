import {Provide} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import {CarEntity} from "../../entity/base";
import {Repository} from "typeorm";
import {InjectEntityModel} from "@midwayjs/orm";
import {CarBodyEntity} from "../../entity/body";

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CarBodyEntity,

  pageQueryOp: {
    select: ['a.*', 'b.model', 'b.year', 'b.brand', 'b.colour', 'b.vinNumber'],

    fieldEq: [
      { column: 'b.model', requestParam: 'model' },
      { column: 'b.departmentId', requestParam: 'departmentId' },
      { column: 'b.year', requestParam: 'year' },
      { column: 'b.brand', requestParam: 'brand' }
    ],
    join: [{
      entity: CarEntity,
      alias: 'b',
      condition: 'a.carID = b.id',
      type: 'leftJoin'
    }]
  },

})
export class CarBodyController extends BaseController {
  @InjectEntityModel(CarBodyEntity)
  vehicleProfileEntity: Repository<CarBodyEntity>
}
