import { Provide, Post, Body, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { RecyclingRecordEntity } from '../../entity/recyclingRecord';
import { RecyclingRecordService } from '../../service/recyclingRecord';
import { CarEntity } from '../../entity/base';
import { OrderInfoEntity } from '../../../order/entity/info';
import { VehicleProcessingEntity } from '../../entity/vehicleProcessing';

/**
 * Recycling Record Controller
 *
 * 6-stage vehicle shell processing pipeline:
 * received → weighed → scheduled → collected → certified → completed
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
      // Vehicle processing assessment data (read-only)
      'vp.weight AS vpWeight',
      'vp.estScrap',
      'vp.catValue',
      'vp.catPresent',
      'vp.catType',
      'vp.catCount',
      'vp.catSerial',
      'vp.catStatus',
    ],
    fieldEq: [
      { column: 'a.stage', requestParam: 'stage' },
      { column: 'a.archived', requestParam: 'archived' },
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'a.finalDestination', requestParam: 'finalDestination' },
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
      {
        entity: VehicleProcessingEntity,
        alias: 'vp',
        condition: 'a.carID = vp.carID',
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

  @Post('/advanceStage')
  async advanceStage(@Body('carID') carID: number) {
    try {
      const newStage = await this.recyclingRecordService.advanceStage(carID);
      return this.ok({ stage: newStage });
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/setStage')
  async setStage(
    @Body('carID') carID: number,
    @Body('stage') stage: string
  ) {
    try {
      await this.recyclingRecordService.setStage(carID, stage);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/batchSetStage')
  async batchSetStage(
    @Body('carIDs') carIDs: number[],
    @Body('stage') stage: string
  ) {
    try {
      await this.recyclingRecordService.batchSetStage(carIDs, stage);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/archive')
  async archive(@Body('carID') carID: number) {
    try {
      await this.recyclingRecordService.archive(carID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/batchArchive')
  async batchArchive(@Body('carIDs') carIDs: number[]) {
    try {
      await this.recyclingRecordService.batchArchive(carIDs);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/archiveCompleted')
  async archiveCompleted() {
    try {
      const count = await this.recyclingRecordService.archiveCompleted();
      return this.ok({ count });
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/stats')
  async stats() {
    try {
      const data = await this.recyclingRecordService.getStats();
      return this.ok(data);
    } catch (e) {
      return this.fail(e);
    }
  }
}
