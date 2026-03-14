import { Provide, Post, Body, Inject, Get, Query } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { PartsVehicleEntity } from '../../entity/partsVehicle';
import { PartsInventoryEntity } from '../../entity/partsInventory';
import { PartsVehicleService } from '../../service/partsVehicle';
import { CarEntity } from '../../entity/base';
import { OrderInfoEntity } from '../../../order/entity/info';

/**
 * Parts Vehicle Controller
 *
 * Manages vehicles in the 6-stage Parts pipeline.
 * Auto-CRUD + custom endpoints for stage transitions and parts management.
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: PartsVehicleEntity,

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
      'b.engineCode',
      'b.engineNumber',
      'b.transmission',
      'b.state',
      'b.carInfo',
      'b.bodyStyle',
      'b.series',
      'b.fuel',
      'b.power',
      'b.cylinders',
      'b.doors',
      'b.seats',
      'b.tareWeight',
      'c.quoteNumber AS stockNumber',
      'c.isDrivable',
      'c.gotKey',
      'c.gotRunning',
      'c.gotPapers',
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
      'c.notDrivableReason',
    ],
    fieldEq: [
      { column: 'a.stage', requestParam: 'stage' },
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'a.shellDestination', requestParam: 'shellDestination' },
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
export class PartsVehicleController extends BaseController {
  @Inject()
  partsVehicleService: PartsVehicleService;

  /**
   * Create from Decision (when destination = Parts).
   */
  @Post('/createFromDecision')
  async createFromDecision(@Body('carID') carID: number) {
    try {
      const record = await this.partsVehicleService.createFromDecision(carID);
      return this.ok(record);
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Move to a specific stage.
   */
  @Post('/moveToStage')
  async moveToStage(
    @Body('carID') carID: number,
    @Body('stage') stage: string,
    @Body('assignedTo') assignedTo?: string
  ) {
    try {
      await this.partsVehicleService.moveToStage(carID, stage, assignedTo);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Move back to previous stage.
   */
  @Post('/moveBack')
  async moveBack(@Body('carID') carID: number) {
    try {
      const newStage = await this.partsVehicleService.moveBack(carID);
      return this.ok(newStage);
    } catch (e) {
      return this.fail(e.message || e);
    }
  }

  /**
   * Close vehicle — set shell destination.
   */
  @Post('/close')
  async close(
    @Body('carID') carID: number,
    @Body('shellDestination') shellDestination: string
  ) {
    try {
      await this.partsVehicleService.close(carID, shellDestination);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  // ===== Parts Inventory =====

  /**
   * Add a part.
   */
  @Post('/addPart')
  async addPart(@Body() data: Partial<PartsInventoryEntity>) {
    try {
      const part = await this.partsVehicleService.addPart(data);
      return this.ok(part);
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Add multiple parts in batch.
   */
  @Post('/addPartsBatch')
  async addPartsBatch(
    @Body('carID') carID: number,
    @Body('parts') parts: any[]
  ) {
    try {
      if (!carID) return this.fail('carID is required');
      if (!parts || !Array.isArray(parts) || parts.length === 0) return this.fail('parts array is required');
      const result = await this.partsVehicleService.addPartsBatch(carID, parts);
      return this.ok(result);
    } catch (e) {
      return this.fail(e.message || e);
    }
  }

  /**
   * Update a part.
   */
  @Post('/updatePart')
  async updatePart(
    @Body('id') id: number,
    @Body('data') data: Partial<PartsInventoryEntity>
  ) {
    try {
      await this.partsVehicleService.updatePart(id, data);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Change part status.
   */
  @Post('/changePartStatus')
  async changePartStatus(
    @Body('id') id: number,
    @Body('status') status: string
  ) {
    try {
      await this.partsVehicleService.changePartStatus(id, status);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Get parts for a car.
   */
  @Get('/partsByCarID')
  async partsByCarID(@Query('carID') carID: number) {
    try {
      const parts = await this.partsVehicleService.getPartsByCarID(carID);
      return this.ok(parts);
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Void a part.
   */
  @Post('/voidPart')
  async voidPart(@Body('id') id: number) {
    try {
      await this.partsVehicleService.voidPart(id);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }
}
