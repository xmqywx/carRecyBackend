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
    keyWordLikeFields: [
      'a.carID',
      'a.disassmblingInformation',
      'a.disassemblyNumber',
      'b.name',
      'b.model',
      'b.year',
      'b.brand',
    ],
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
      { column: 'a.status', requestParam: 'status' },
      {
        column: 'a.disassmblingInformation',
        requestParam: 'disassmblingInformation',
      },
      { column: 'a.disassemblyNumber', requestParam: 'disassemblyNumber' },
      { column: 'p.collected', requestParam: 'collected' },
      { column: 'b.model', requestParam: 'model' },
      { column: 'b.departmentId', requestParam: 'departmentId' },
      { column: 'b.year', requestParam: 'year' },
      { column: 'b.brand', requestParam: 'brand' },
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
    where: async ctx => {
      const {
        partKeyWord,
        isSold,
        isPaid,
        isDeposit,
        noSold,
        noPaid,
        noDeposit,
        lowestSoldPrice,
        highestSoldPrice,
        containerNumber,
      } = ctx.request.body;
      // 因为根据分类排序了，所以会导致就算是后端列表排序了也会打乱顺序
      let hightSqlSearch = '';
      let lowestSqlSearch = '';
      if (lowestSoldPrice || highestSoldPrice) {
        const hightSql =
          'p.soldPrice = (select MAX(soldPrice) from `cool-admin`.part_transactions';
        const lowestSql =
          'p.soldPrice = (select MIN(soldPrice) from `cool-admin`.part_transactions';
        const sqlArr = [];
        if (containerNumber) {
          sqlArr.push(`containerNumber = '${containerNumber}'`);
        }
        // if (keyWord) {
        //   sqlArr.push(
        //     `(carID LIKE '%${keyWord}%' OR disassemblyNumber LIKE '%${keyWord}%' OR disassmblingInformation LIKE '%${keyWord}%' OR disassemblyDescription LIKE '%${keyWord}%')`
        //   );
        // }
        hightSqlSearch =
          hightSql +
          (sqlArr.length > 0 ? ' where ' : '') +
          sqlArr.join(' and ') +
          ')';
        lowestSqlSearch =
          lowestSql +
          (sqlArr.length > 0 ? ' where ' : '') +
          sqlArr.join(' and ') +
          ')';
      }
      return [
        partKeyWord
          ? [
              `(a.disassmblingInformation LIKE :partKeyWord1 OR a.disassemblyDescription LIKE :partKeyWord2 OR a.disassemblyNumber LIKE :partKeyWord3)`,
              {
                partKeyWord1: `%${partKeyWord}%`,
                partKeyWord2: `%${partKeyWord}%`,
                partKeyWord3: `%${partKeyWord}%`,
              },
            ]
          : [],
        isSold ? ['p.soldPrice IS NOT NULL AND p.soldPrice > 0', {}] : [],
        isPaid ? ['p.paidPrice IS NOT NULL AND p.paidPrice > 0', {}] : [],
        isDeposit ? ['p.depositPrice IS NOT NULL AND p.depositPrice > 0', {}] : [],
        noSold ? ['(p.soldPrice IS NULL OR p.soldPrice = 0)', {}] : [],
        noPaid ? ['(p.paidPrice IS NULL OR p.paidPrice = 0)', {}] : [],
        noDeposit ? ['(p.depositPrice IS NULL OR p.depositPrice = 0)', {}] : [],
        lowestSoldPrice ? [lowestSqlSearch, {}] : [],
        highestSoldPrice ? [hightSqlSearch, {}] : [],
      ];
    },
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

  /**
   * 获得总数统计
   */
  @Post('/handleToGetCarWreckedTotal')
  async handleToGetCarWreckedTotal(
    @Body('isSold') isSold: boolean,
    @Body('isPaid') isPaid: boolean,
    @Body('collected') collected: boolean,
    @Body('isDeposit') isDeposit: boolean,
    @Body('noSold') noSold: boolean,
    @Body('noPaid') noPaid: boolean,
    @Body('noDeposit') noDeposit: boolean,
    @Body('lowestSoldPrice') lowestSoldPrice: boolean,
    @Body('containerNumber') containerNumber: any,
    @Body('highestSoldPrice') highestSoldPrice: boolean,
    @Body('disassmblingInformation') disassmblingInformation: string,
    @Body('keyWord') keyWord: string
  ) {
    const filters = {
      isSold,
      isPaid,
      collected,
      isDeposit,
      containerNumber,
      noSold,
      noPaid,
      noDeposit,
      lowestSoldPrice,
      highestSoldPrice,
      keyWord,
      disassmblingInformation,
    };
    try {
      const data = await this.carPartsService.handleToGetCarWreckedTotal(
        filters
      );
      return this.ok(data);
    } catch (e) {
      return this.fail(e);
    }
  }
}
