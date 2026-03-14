import { Provide, Post, Body, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { RecyclingRecordEntity } from '../../entity/recyclingRecord';
import { RecyclingRecordService } from '../../service/recyclingRecord';
import { CarEntity } from '../../entity/base';
import { OrderInfoEntity } from '../../../order/entity/info';

/**
 * Recycling Record Controller
 *
 * Vehicle shell processing after Parts dismantling.
 * Supports batch operations for In Progress / Completed views.
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: RecyclingRecordEntity,

  pageQueryOp: {
    keyWordLikeFields: ['b.brand', 'b.model', 'b.registrationNumber', 'b.vinNumber', 'c.quoteNumber'],
    select: [
      'a.*',
      'b.brand',
      'b.model',
      'b.year',
      'b.colour',
      'b.registrationNumber',
      'b.vinNumber',
      'b.image',
      'b.engine',
      'b.transmission',
      'b.fuel',
      'b.tareWeight',
      'c.quoteNumber AS stockNumber',
      'c.leadSource AS source',
    ],
    fieldEq: [
      { column: 'a.status', requestParam: 'status' },
      { column: 'a.carID', requestParam: 'carID' },
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
        condition: 'b.id = c.carID',
        type: 'leftJoin',
      },
    ],
    addOrderBy: () => ({ 'a.createTime': 'DESC' }),
  },
})
export class RecyclingRecordController extends BaseController {
  @Inject()
  recyclingRecordService: RecyclingRecordService;

  @Post('/createFromParts')
  async createFromParts(
    @Body('carID') carID: number,
    @Body('partsVehicleID') partsVehicleID?: number
  ) {
    try {
      const record = await this.recyclingRecordService.createFromParts(carID, partsVehicleID);
      return this.ok(record);
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/complete')
  async complete(
    @Body('carID') carID: number,
    @Body('finalDestination') finalDestination?: string
  ) {
    try {
      await this.recyclingRecordService.complete(carID, finalDestination);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/batchUpdateStatus')
  async batchUpdateStatus(
    @Body('carIDs') carIDs: number[],
    @Body('status') status: string
  ) {
    try {
      await this.recyclingRecordService.batchUpdateStatus(carIDs, status);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }
}
