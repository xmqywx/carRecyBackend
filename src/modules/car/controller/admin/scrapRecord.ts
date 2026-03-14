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

  @Post('/close')
  async close(@Body('carID') carID: number) {
    try {
      await this.scrapRecordService.close(carID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }
}
