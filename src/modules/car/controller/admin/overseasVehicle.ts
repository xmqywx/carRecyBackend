import { Provide, Post, Body, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { OverseasVehicleEntity } from '../../entity/overseasVehicle';
import { OverseasVehicleService } from '../../service/overseasVehicle';
import { CarEntity } from '../../entity/base';
import { OrderInfoEntity } from '../../../order/entity/info';

@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: OverseasVehicleEntity,

  pageQueryOp: {
    keyWordLikeFields: ['b.brand', 'b.model', 'b.registrationNumber', 'c.quoteNumber'],
    select: [
      'a.*',
      'b.brand',
      'b.model',
      'b.year',
      'b.colour',
      'b.registrationNumber',
      'b.vinNumber',
      'b.image',
      'c.quoteNumber AS stockNumber',
    ],
    fieldEq: [
      { column: 'a.stage', requestParam: 'stage' },
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'a.destinationCountry', requestParam: 'destinationCountry' },
    ],
    join: [
      {
        entity: CarEntity,
        alias: 'b',
        condition: 'a.carID = b.id',
        type: 'leftJoin',
      },
      {
        entity: OrderInfoEntity,
        alias: 'c',
        condition: 'a.carID = c.carID',
        type: 'leftJoin',
      },
    ],
    addOrderBy: () => ({ 'a.createTime': 'DESC' }),
  },
})
export class OverseasVehicleController extends BaseController {
  @Inject()
  overseasVehicleService: OverseasVehicleService;

  @Post('/createFromDecision')
  async createFromDecision(@Body('carID') carID: number) {
    try {
      const record = await this.overseasVehicleService.createFromDecision(carID);
      return this.ok(record);
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/startDismantling')
  async startDismantling(@Body('carID') carID: number) {
    try {
      await this.overseasVehicleService.startDismantling(carID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/completeDismantling')
  async completeDismantling(@Body('id') id: number) {
    try {
      await this.overseasVehicleService.completeDismantling(id);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }
}
