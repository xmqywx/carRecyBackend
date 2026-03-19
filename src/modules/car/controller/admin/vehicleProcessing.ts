import { Provide, Post, Body, Inject, Get, Query } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { VehicleProcessingEntity } from '../../entity/vehicleProcessing';
import { VehicleProcessingService } from '../../service/vehicleProcessing';
import { CarEntity } from '../../entity/base';
import { OrderInfoEntity } from '../../../order/entity/info';

/**
 * Vehicle Processing Controller
 *
 * Manages the 4-stage yard processing pipeline.
 * Auto-CRUD + custom endpoints for stage transitions and check toggling.
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: VehicleProcessingEntity,

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
      'b.state',
      'b.fuel',
      'b.engineCode',
      'b.doors',
      'b.seats',
      'b.carInfo',
      'b.bodyStyle',
      'b.engineNumber',
      'b.power',
      'b.engineSizeCc',
      'b.cylinders',
      'b.tareWeight',
      'b.platesReturned',
      'b.registered',
      'c.quoteNumber AS stockNumber',
      'c.leadSource AS source',
      'c.actualPaymentPrice',
      'c.payMethod',
      'c.pickupAddress',
      'c.expectedDate',
      'c.isDrivable',
      'c.notDrivableReason',
      'c.gotKey',
      'c.gotPapers',
      'c.gotRunning',
      'c.gotVehicleComplete',
      'c.gotAccidentDamage',
      'c.gotFireFloodDamage',
      'c.gotMissingComponents',
      'c.gotEngineStarts',
      'c.gotLicense',
      'c.gotBattery',
      'c.gotCatalytic',
      'c.gotWheels',
      'c.gotEasy',
      'c.gotNotBusy',
      'c.imageFileDir',
      'c.vehiclePhoto',
      'c.paymentRemittance',
      'c.driverLicense',
      'c.registrationDoc',
      'c.leadSourceDetail',
      'c.createBy',
    ],
    fieldEq: [
      { column: 'a.stage', requestParam: 'stage' },
      { column: 'a.destination', requestParam: 'destination' },
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'a.assignedTo', requestParam: 'assignedTo' },
      { column: 'c.leadSource', requestParam: 'source' },
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
    where: async function (ctx) {
      const { excludeCompleted } = ctx.request.body;
      // By default exclude completed vehicles (unless explicitly set to false)
      if (excludeCompleted !== false) {
        return [["a.stage != 'completed'", {}]];
      }
      return [];
    },
    addOrderBy: () => ({ 'a.createTime': 'DESC' }),
  },

  listQueryOp: {
    select: ['a.id', 'a.carID', 'a.stage'],
    fieldEq: [
      { column: 'a.stage', requestParam: 'stage' },
      { column: 'a.carID', requestParam: 'carID' },
    ],
    where: async function (ctx) {
      return [["a.stage != 'completed'", {}]];
    },
  },
})
export class VehicleProcessingController extends BaseController {
  @Inject()
  vehicleProcessingService: VehicleProcessingService;

  /**
   * Get vehicle counts grouped by stage (for kanban headers/stats).
   */
  @Get('/stageCounts')
  async stageCounts() {
    try {
      const counts = await this.vehicleProcessingService.getStageCounts();
      return this.ok(counts);
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Get processing records for multiple cars (batch).
   */
  @Post('/getByCarIDs')
  async getByCarIDs(@Body('carIDs') carIDs: number[]) {
    try {
      const records = await this.vehicleProcessingService.getByCarIDs(carIDs);
      return this.ok(records);
    } catch (e) {
      return this.fail(e);
    }
  }

  // ===== Stage transitions =====

  @Post('/moveNext', { summary: 'Move vehicle to next stage' })
  async moveNext(
    @Body('carID') carID: number,
    @Body('assignedTo') assignedTo?: string
  ) {
    try {
      await this.vehicleProcessingService.moveNext(carID, assignedTo);
      return this.ok();
    } catch (e) {
      return this.fail(e.message || e);
    }
  }

  // DEPRECATED — use moveNext instead
  @Post('/moveToInspect')
  async moveToInspect(
    @Body('carID') carID: number,
    @Body('assignedTo') assignedTo?: string
  ) {
    try {
      await this.vehicleProcessingService.moveToInspect(carID, assignedTo);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  // DEPRECATED — use moveNext instead
  @Post('/moveToDepollute')
  async moveToDepollute(
    @Body('carID') carID: number,
    @Body('assignedTo') assignedTo?: string
  ) {
    try {
      await this.vehicleProcessingService.moveToDepollute(carID, assignedTo);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  // DEPRECATED — use moveNext instead
  @Post('/moveToDecision')
  async moveToDecision(@Body('carID') carID: number) {
    try {
      await this.vehicleProcessingService.moveToDecision(carID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  // DEPRECATED — use moveNext instead
  @Post('/moveToLabel')
  async moveToLabel(@Body('carID') carID: number) {
    try {
      await this.vehicleProcessingService.moveToDecision(carID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/moveBack')
  async moveBack(@Body('carID') carID: number) {
    try {
      const newStage = await this.vehicleProcessingService.moveBack(carID);
      return this.ok(newStage);
    } catch (e) {
      return this.fail(e.message || e);
    }
  }

  @Post('/complete')
  async complete(
    @Body('carID') carID: number,
    @Body('destination') destination: string
  ) {
    try {
      await this.vehicleProcessingService.complete(carID, destination);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Update processing record (estimates, cat info, weight, notes).
   */
  @Post('/updateRecord')
  async updateRecord(
    @Body('carID') carID: number,
    @Body('data') data: any
  ) {
    try {
      await this.vehicleProcessingService.updateRecord(carID, data);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  // ===== Inspect checks =====

  @Get('/inspectChecks')
  async getInspectChecks(@Query('carID') carID: number) {
    try {
      const checks = await this.vehicleProcessingService.getInspectChecks(carID);
      return this.ok(checks);
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/inspectChecksBatch')
  async getInspectChecksBatch(@Body('carIDs') carIDs: number[]) {
    try {
      const checks = await this.vehicleProcessingService.getInspectChecksBatch(carIDs);
      return this.ok(checks);
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/toggleInspectCheck')
  async toggleInspectCheck(
    @Body('id') id: number,
    @Body('checked') checked: boolean,
    @Body('checkedBy') checkedBy?: string
  ) {
    try {
      await this.vehicleProcessingService.toggleInspectCheck(id, checked, checkedBy);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/updateInspectCheckValue')
  async updateInspectCheckValue(
    @Body('id') id: number,
    @Body('value') value: string
  ) {
    try {
      await this.vehicleProcessingService.updateInspectCheckValue(id, value);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/updateInspectCondition')
  async updateInspectCondition(
    @Body('id') id: number,
    @Body('condition') condition: string,
    @Body('checkedBy') checkedBy?: string
  ) {
    try {
      await this.vehicleProcessingService.updateInspectCondition(id, condition, checkedBy);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  // ===== Depollute checks =====

  @Get('/depolluteChecks')
  async getDepolluteChecks(@Query('carID') carID: number) {
    try {
      const checks = await this.vehicleProcessingService.getDepolluteChecks(carID);
      return this.ok(checks);
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/depolluteChecksBatch')
  async getDepolluteChecksBatch(@Body('carIDs') carIDs: number[]) {
    try {
      const checks = await this.vehicleProcessingService.getDepolluteChecksBatch(carIDs);
      return this.ok(checks);
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/toggleDepolluteCheck')
  async toggleDepolluteCheck(
    @Body('id') id: number,
    @Body('checked') checked: boolean,
    @Body('checkedBy') checkedBy?: string
  ) {
    try {
      await this.vehicleProcessingService.toggleDepolluteCheck(id, checked, checkedBy);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/updateDepolluteStatus')
  async updateDepolluteStatus(
    @Body('id') id: number,
    @Body('status') status: string,
    @Body('checkedBy') checkedBy?: string
  ) {
    try {
      await this.vehicleProcessingService.updateDepolluteStatus(id, status, checkedBy);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  // ===== Progress =====

  @Get('/inspectProgress')
  async inspectProgress(@Query('carID') carID: number) {
    try {
      const progress = await this.vehicleProcessingService.calcInspectProgress(carID);
      return this.ok(progress);
    } catch (e) {
      return this.fail(e);
    }
  }

  @Get('/depolluteProgress')
  async depolluteProgress(@Query('carID') carID: number) {
    try {
      const progress = await this.vehicleProcessingService.calcDepolluteProgress(carID);
      return this.ok(progress);
    } catch (e) {
      return this.fail(e);
    }
  }
  /**
   * Get full workflow timeline for a vehicle (Decision drawer).
   */
  @Get('/timeline')
  async timeline(@Query('carID') carID: number) {
    try {
      const data = await this.vehicleProcessingService.getTimeline(carID);
      return this.ok(data);
    } catch (e) {
      return this.fail(e);
    }
  }
}

// InspectCheck and DepolluteCheck don't need separate controllers —
// all check operations are handled via VehicleProcessingController endpoints above.
