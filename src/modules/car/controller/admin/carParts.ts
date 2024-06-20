import { Provide, Post, Body, Inject, Get, Query } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { CarPartsEntity } from '../../entity/carParts';
import {} from '../../service/car';
import { CarPartsService } from '../../service/car';
import { CarBaseService } from '../../service/car';
import { CarEntity } from '../../entity/base';
import { ContainerEntity } from '../../../container/entity/base';
import { BuyerEntity } from '../../../buyer/entity/base';
import { PartTransactionsEntity } from '../../../partTransactions/entity/base';
/**
 * 描述
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CarPartsEntity,

  pageQueryOp: {
    keyWordLikeFields: ['carID', 'b.name', 'b.model', 'b.year', 'b.brand'],
    select: [
      'a.*',
      'c.containerNumber',
      'b.model',
      'b.year',
      'b.brand',
      'b.colour',
      'b.vinNumber',
      'b.name',
      'b.registrationNumber',
      'b.state',
      'b.series',
      'b.engine',
      'b.bodyStyle',
      'b.carInfo',
      'e.name as buyer_name',
      'e.phone as buyer_phone',
      'e.address as buyer_address',
      'p.soldDate',
      'p.depositDate',
      'p.paidDate',
      'p.collectedDate',
      'p.paidPrice as paid',
      'p.soldPrice as sold',
      'p.depositPrice as deposit',
      'p.collected',
      'p.id as part_transaction_id',
      'd.name as collector_name',
      'd.phone as collector_phone',
      'd.address as collector_address',
    ],
    fieldEq: [
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'c.containerNumber', requestParam: 'containerNumber' },
      { column: 'b.recyclingStatus', requestParam: 'recyclingStatus' },
    ],
    join: [
      {
        entity: CarEntity,
        alias: 'b',
        condition: 'a.carID = b.id',
        type: 'leftJoin',
      },
      {
        entity: ContainerEntity,
        alias: 'c',
        condition: 'a.containerID = c.id',
        type: 'leftJoin',
      },
      {
        entity: PartTransactionsEntity,
        alias: 'p',
        condition: 'a.id = p.carWreckedID and p.status = 0',
        type: 'leftJoin',
      },
      {
        entity: BuyerEntity,
        alias: 'd',
        condition: 'p.collectorID = d.id',
        type: 'leftJoin',
      },
      {
        entity: BuyerEntity,
        alias: 'e',
        condition: 'p.buyerID = e.id',
        type: 'leftJoin',
      },
    ],
    where: async (ctx) => {
      const { partKeyWord } = ctx.request.body;
      return [
        partKeyWord ? [
          `(a.disassmblingInformation LIKE :partKeyWord1 OR a.disassemblyDescription LIKE :partKeyWord2 OR a.disassemblyNumber LIKE :partKeyWord3)`,
          { 
            partKeyWord1: `%${partKeyWord}%`,
            partKeyWord2: `%${partKeyWord}%`,
            partKeyWord3: `%${partKeyWord}%`,
           }
        ] : []
      ]
    }
  },

  listQueryOp: {
    keyWordLikeFields: ['carID'],
    select: [
      'a.*',
      'c.containerNumber',
      'b.model',
      'b.year',
      'b.brand',
      'b.colour',
      'b.vinNumber',
      'b.name',
      'b.registrationNumber',
      'b.state',
      'b.series',
      'b.engine',
      'b.bodyStyle',
      'b.carInfo',
    ],
    fieldEq: [
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'c.containerNumber', requestParam: 'containerNumber' },
    ],
    join: [
      {
        entity: CarEntity,
        alias: 'b',
        condition: 'a.carID = b.id',
        type: 'leftJoin',
      },
      {
        entity: ContainerEntity,
        alias: 'c',
        condition: 'a.containerID = c.id',
        type: 'leftJoin',
      },
    ],
  },
})
export class CarPartsController extends BaseController {
  @Inject()
  carPartsService: CarPartsService;

  @Inject()
  carBaseService: CarBaseService;

  /**
   * 添加零件
   */
  @Post('/add_parts')
  async addParts(@Body('info') info: any) {
    console.log('params', info);
    try {
      await this.carPartsService.addParts(info);
      await this.carBaseService.changeCarStatus(3, info.carID);
      return this.ok();
    } catch (e) {
      console.log('ERROR ', e);
      return this.fail(e);
    }
  }

  @Post('/get_parts_width_ids')
  async gerPartsWidthIds(@Body('ids') ids: number[]) {
    try {
      const list = await this.carPartsService.gerPartsWidthIds(ids);
      return this.ok(list);
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * 将零件从container中移除
   */
  @Post('/moveOutFromContainer')
  async moveOutFromContainer(
    @Body('partId') partId: number,
    @Body('containerNumber') containerNumber: string
  ) {
    try {
      await this.carPartsService.moveOutFromContainer(partId, containerNumber);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * 更新并生成log
   */
  @Post('/updateAndInsertLog')
  async updateAndInsertLog(@Body() params) {
    try {
      const result = await this.carPartsService.updateAndInsertLog(params);
      return this.ok(result);
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * 根据交易记录获取零件信息
   */
  @Get('/getCarWreckedWidthTransaction')
  async getCarWreckedWidthTransaction(@Query('id') id: number) {
    const carWreckedInfo =
      await this.carPartsService.getCarWreckedWidthTransaction(id);
    if (carWreckedInfo) return this.ok(carWreckedInfo);
    return this.fail();
  }
}
