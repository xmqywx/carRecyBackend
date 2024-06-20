import { Provide, Inject, Post, Body } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { CarEntity } from '../../entity/base';
import { CarCatalyticConverterEntity } from '../../entity/carCatalyticConverter';
import { CarCatalyticConverterService } from '../../service/car';

/**
 * 描述
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CarCatalyticConverterEntity,
  pageQueryOp: {
    keyWordLikeFields: [
      'carID',
    ],
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
      'b.carInfo',
    ],
    fieldEq: [
      { column: 'a.carID', requestParam: 'carID' },
    ],
    join: [
      {
        entity: CarEntity,
        alias: 'b',
        condition: 'a.carID = b.id',
        type: 'leftJoin',
      },
    ]
  },
  listQueryOp:  {
    keyWordLikeFields: [
      'carID',
    ],
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
      'b.carInfo',
    ],
    fieldEq: [
      { column: 'a.carID', requestParam: 'carID' },
    ],
    join: [
      {
        entity: CarEntity,
        alias: 'b',
        condition: 'a.carID = b.id',
        type: 'leftJoin',
      },
    ]
  },
})
export class CarCatalyticConverterController extends BaseController {
  @Inject()
  carCatalyticConverterService: CarCatalyticConverterService;

  @Post('/get_catalytic_converters_width_ids')
  async getCatalyticConverterWidthIds(@Body('ids') ids: number[]) {
    try {
      const list = await this.carCatalyticConverterService.getCatalyticConverterWidthIds(ids);
      return this.ok(list);
    } catch (e) {
      return this.fail(e);
    }
  }
}
