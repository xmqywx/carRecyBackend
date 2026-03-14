import { Provide, Post, Body, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { SoldCompleteEntity } from '../../entity/soldComplete';
import { SoldCompleteService } from '../../service/soldComplete';
import { CarEntity } from '../../entity/base';
import { OrderInfoEntity } from '../../../order/entity/info';

/**
 * Sold Complete Controller
 *
 * 3-step whole-vehicle sale wizard.
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: SoldCompleteEntity,

  pageQueryOp: {
    keyWordLikeFields: ['a.buyerName', 'a.invoiceNumber', 'b.brand', 'b.model', 'b.registrationNumber', 'c.quoteNumber'],
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
      'b.engine',
      'c.quoteNumber AS stockNumber',
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
export class SoldCompleteController extends BaseController {
  @Inject()
  soldCompleteService: SoldCompleteService;

  @Post('/createFromDecision')
  async createFromDecision(@Body('carID') carID: number) {
    try {
      const record = await this.soldCompleteService.createFromDecision(carID);
      return this.ok(record);
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/saveBuyerDetails')
  async saveBuyerDetails(
    @Body('carID') carID: number,
    @Body('data') data: any
  ) {
    try {
      await this.soldCompleteService.saveBuyerDetails(carID, data);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/generateInvoice')
  async generateInvoice(
    @Body('carID') carID: number,
    @Body('invoiceNumber') invoiceNumber: string
  ) {
    try {
      await this.soldCompleteService.generateInvoice(carID, invoiceNumber);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/markEmailSent')
  async markEmailSent(@Body('carID') carID: number) {
    try {
      await this.soldCompleteService.markEmailSent(carID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/markPaid')
  async markPaid(
    @Body('carID') carID: number,
    @Body('payMethod') payMethod?: string
  ) {
    try {
      await this.soldCompleteService.markPaid(carID, payMethod);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/close')
  async close(@Body('carID') carID: number) {
    try {
      await this.soldCompleteService.close(carID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }
}
