import { Provide, Post, Body, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { RecyclingRecordEntity } from '../../entity/recyclingRecord';
import { InventoryEntity } from '../../entity/inventory';
import { RecyclingRecordService } from '../../service/recyclingRecord';
import { TransferService } from '../../service/transfer';
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
      { column: 'a.partsStage', requestParam: 'partsStage' },
      { column: 'a.shellDestination', requestParam: 'shellDestination' },
    ],
    where: async () => {
      // Recycling shows: cars currently in 'recycling', OR cars in terminal modules (sold_complete/scrap) that came FROM recycling
      return [["(b.currentModule = 'recycling' OR (b.currentModule IN ('sold_complete','scrap') AND b.sourceModule = 'recycling'))", {}]];
    },
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

  @Inject()
  transferService: TransferService;

  @InjectEntityModel(RecyclingRecordEntity)
  recyclingRecordRepo: Repository<RecyclingRecordEntity>;

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

  // ===== Parts Pipeline =====

  /**
   * Move vehicle to a parts pipeline stage.
   */
  @Post('/moveToPartsStage')
  async moveToPartsStage(
    @Body('carID') carID: number,
    @Body('partsStage') partsStage: string
  ) {
    try {
      await this.recyclingRecordService.moveToPartsStage(carID, partsStage);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Alias: moveToStage → moveToPartsStage (for generic module compatibility)
   */
  @Post('/moveToStage')
  async moveToStage(
    @Body('carID') carID: number,
    @Body('stage') stage: string
  ) {
    try {
      await this.recyclingRecordService.moveToPartsStage(carID, stage);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Move back one parts pipeline stage.
   */
  @Post('/moveBack')
  async moveBack(@Body('carID') carID: number) {
    try {
      const record = await this.recyclingRecordRepo.findOne({ where: { carID } });
      if (!record) return this.fail('Record not found');
      const stages = ['inventory', 'marketing', 'dismantling', 'shelving', 'sold', 'closed'];
      const idx = stages.indexOf(record.partsStage || 'inventory');
      if (idx <= 0) return this.fail('Already at first stage');
      await this.recyclingRecordService.moveToPartsStage(carID, stages[idx - 1]);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Close vehicle — set shell destination and auto-create downstream record.
   */
  @Post('/close')
  async closeVehicle(
    @Body('carID') carID: number,
    @Body('shellDestination') shellDestination?: string
  ) {
    try {
      if (!shellDestination) return this.fail('shellDestination is required');
      const moduleMap: Record<string, string> = { 'Parts': 'parts', 'Scrap': 'scrap', 'Sold Complete': 'sold_complete', 'Overseas': 'overseas' };
      const targetModule = moduleMap[shellDestination] || shellDestination;
      await this.transferService.transfer(carID, targetModule);
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
  async addPart(@Body() data: Partial<InventoryEntity>) {
    try {
      const part = await this.recyclingRecordService.addPart(data);
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
      const result = await this.recyclingRecordService.addPartsBatch(carID, parts);
      return this.ok(result);
    } catch (e) {
      return this.fail(e.message || e);
    }
  }

  /**
   * Void a part (soft-delete).
   */
  @Post('/voidPart')
  async voidPart(@Body('id') id: number) {
    try {
      await this.recyclingRecordService.voidPart(id);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Get parts for a car.
   */
  @Post('/partsByCarID')
  async partsByCarID(@Body('carID') carID: number) {
    try {
      const parts = await this.recyclingRecordService.getPartsByCarID(carID);
      return this.ok(parts);
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
      await this.recyclingRecordService.changePartStatus(id, status);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Update a part.
   */
  @Post('/updatePart')
  async updatePart(
    @Body('id') id: number,
    @Body('data') data: Partial<InventoryEntity>
  ) {
    try {
      await this.recyclingRecordService.updatePart(id, data);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }
}
