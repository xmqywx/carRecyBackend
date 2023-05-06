import {Provide} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import {CarEntity} from "../../entity/base";
import {Repository} from "typeorm";
import {InjectEntityModel} from "@midwayjs/orm";
import {CarEngineEntity} from "../../entity/engine";

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CarEngineEntity,

  pageQueryOp: {
    select: ['a.*', 'b.model', 'b.year', 'b.brand', 'b.colour', 'b.vinNumber'],
    fieldEq: [
      { column: 'b.model', requestParam: 'model' },
      { column: 'a.carID', requestParam: 'carID' },
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
export class CarEngineController extends BaseController {
  @InjectEntityModel(CarEngineEntity)
  vehicleProfileEntity: Repository<CarEngineEntity>
}
