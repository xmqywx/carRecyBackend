import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { CarEntity } from '../../entity/base';
import { Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/orm';
import { CarBodyEntity } from '../../entity/body';

/**
 * 汽车车体
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CarBodyEntity,
  pageQueryOp: {
    keyWordLikeFields: ['carID'],
    select: [
      'a.*',
      'b.model',
      'b.year',
      'b.brand',
      'b.colour',
      'b.vinNumber',
      'b.name',
      'b.registrationNumber',
      'b.state',
      'b.series',
      'b.engine',
      'b.bodyStyle',
    ],
    fieldEq: [
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'b.model', requestParam: 'model' },
      { column: 'b.departmentId', requestParam: 'departmentId' },
      { column: 'b.year', requestParam: 'year' },
      { column: 'b.brand', requestParam: 'brand' },
    ],
    join: [
      {
        entity: CarEntity,
        alias: 'b',
        condition: 'a.carID = b.id',
        type: 'leftJoin',
      },
    ],
  },
})
export class CarBodyController extends BaseController {
  @InjectEntityModel(CarBodyEntity)
  vehicleProfileEntity: Repository<CarBodyEntity>;
}
