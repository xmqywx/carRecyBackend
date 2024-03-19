import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/orm';
import { CarRegEntity } from '../../entity/info';

/**
 * 通过api查询获得的汽车信息表
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CarRegEntity,

  pageQueryOp: {
    keyWordLikeFields: ['name', 'year', 'model'],

    fieldEq: ['name', 'year'],
  },
})
export class CarRegController extends BaseController {
  @InjectEntityModel(CarRegEntity)
  carRegEntity: Repository<CarRegEntity>;
}
