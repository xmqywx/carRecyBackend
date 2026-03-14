import { Provide, Post, Body, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { OverseasVehicleEntity } from '../../entity/overseasVehicle';
import { OverseasVehicleService } from '../../service/overseasVehicle';
import { CarEntity } from '../../entity/base';

/**
 * Overseas Vehicle Controller
 *
 * Manages vehicles in the 4-stage export pipeline.
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: OverseasVehicleEntity,

  pageQueryOp: {
    keyWordLikeFields: ['b.brand', 'b.model', 'b.registrationNumber'],
    select: [
      'a.*',
      'b.brand',
      'b.model',
      'b.year',
      'b.colour',
      'b.registrationNumber',
      'b.vinNumber',
      'b.image',
    ],
    fieldEq: [
      { column: 'a.stage', requestParam: 'stage' },
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'a.containerID', requestParam: 'containerID' },
      { column: 'a.destinationCountry', requestParam: 'destinationCountry' },
    ],
    join: [
      {
        entity: CarEntity,
        alias: 'b',
        condition: 'a.carID = b.id',
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

  @Post('/assignToContainer')
  async assignToContainer(
    @Body('carID') carID: number,
    @Body('containerID') containerID: number
  ) {
    try {
      await this.overseasVehicleService.assignToContainer(carID, containerID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/markLoaded')
  async markLoaded(@Body('carID') carID: number) {
    try {
      await this.overseasVehicleService.markLoaded(carID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/close')
  async close(@Body('carID') carID: number) {
    try {
      await this.overseasVehicleService.close(carID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/moveBack')
  async moveBack(@Body('carID') carID: number) {
    try {
      const newStage = await this.overseasVehicleService.moveBack(carID);
      return this.ok(newStage);
    } catch (e) {
      return this.fail(e.message || e);
    }
  }
}
