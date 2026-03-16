import { Provide, Post, Body, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { ScrapRecordEntity } from '../../entity/scrapRecord';
import { ScrapRecordService } from '../../service/scrapRecord';
import { CarEntity } from '../../entity/base';
import { OrderInfoEntity } from '../../../order/entity/info';

/**
 * Scrap Record Controller
 *
 * Terminal list for scrapped vehicles.
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: ScrapRecordEntity,

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
      'b.tareWeight',
      'c.quoteNumber AS stockNumber',
    ],
    fieldEq: [
      { column: 'a.status', requestParam: 'status' },
      { column: 'a.source', requestParam: 'source' },
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
export class ScrapRecordController extends BaseController {
  @Inject()
  scrapRecordService: ScrapRecordService;

  @Post('/createRecord')
  async createRecord(
    @Body('carID') carID: number,
    @Body('source') source: string,
    @Body('estScrapValue') estScrapValue?: number
  ) {
    try {
      const record = await this.scrapRecordService.create(carID, source, estScrapValue);
      return this.ok(record);
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/markProcessed')
  async markProcessed(
    @Body('carID') carID: number,
    @Body('data') data?: any
  ) {
    try {
      await this.scrapRecordService.markProcessed(carID, data);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/saveDealer')
  async saveDealer(@Body() body: any) {
    try {
      const { id, dealerName, dealerPhone, pickupDate, dealerNotes } = body;
      const rows = await this.scrapRecordService.nativeQuery(
        'SELECT carID FROM scrap_record WHERE id = ? LIMIT 1', [id]
      );
      if (!rows?.[0]) return this.fail('Record not found');
      await this.scrapRecordService.updateRecord(rows[0].carID, {
        dealerName, dealerPhone, pickupDate, dealerNotes,
      } as any);
      return this.ok();
    } catch (e) {
      return this.fail(e.message || e);
    }
  }

  @Post('/savePaymentDetails')
  async savePaymentDetails(@Body() body: any) {
    try {
      const { id, actualWeight, pricePerKg, catConverterSold } = body;
      const rows = await this.scrapRecordService.nativeQuery(
        'SELECT carID FROM scrap_record WHERE id = ? LIMIT 1', [id]
      );
      if (!rows?.[0]) return this.fail('Record not found');
      await this.scrapRecordService.updateRecord(rows[0].carID, {
        actualWeight, pricePerKg, catConverterSold,
      } as any);
      return this.ok();
    } catch (e) {
      return this.fail(e.message || e);
    }
  }

  @Post('/close')
  async close(@Body('carID') carID: number) {
    try {
      await this.scrapRecordService.close(carID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/batchClose')
  async batchClose(@Body('carIDs') carIDs: number[]) {
    try {
      for (const carID of carIDs) {
        await this.scrapRecordService.close(carID);
      }
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/closeCompleted')
  async closeCompleted() {
    try {
      const records = await this.scrapRecordService.nativeQuery(
        `SELECT carID FROM scrap_record WHERE status = 'completed'`
      );
      for (const r of records) {
        await this.scrapRecordService.close(r.carID);
      }
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/advanceStatus')
  async advanceStatus(@Body('carID') carID: number) {
    try {
      const next = await this.scrapRecordService.advanceStatus(carID);
      return this.ok({ status: next });
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/batchSetStatus')
  async batchSetStatus(
    @Body('carIDs') carIDs: number[],
    @Body('status') status: string
  ) {
    try {
      await this.scrapRecordService.batchSetStatus(carIDs, status);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/stats')
  async stats() {
    try {
      const data = await this.scrapRecordService.getStats();
      return this.ok(data);
    } catch (e) {
      return this.fail(e);
    }
  }
}
