import { Provide, Post, Inject, Body, Get, Query } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { CarWreckedEntity } from "../../entity/carWrecked";
import { CarEntity } from "../../entity/base";
import { Repository } from "typeorm";
import { InjectEntityModel } from "@midwayjs/orm";
import { CarWreckedService, CarBaseService } from '../../service/car';
import { BuyerEntity } from '../../../buyer/entity/base';
import { PartTransactionsEntity } from '../../../partTransactions/entity/base';

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CarWreckedEntity,
  pageQueryOp: {
    keyWordLikeFields: ['carID', 'disassemblyNumber', 'disassmblingInformation', 'disassemblyDescription'],
    select: ['a.*', 'b.model', 'b.year', 'b.brand', 'b.colour', 'b.vinNumber', 'b.name', 'b.registrationNumber', 'b.state', 'b.series', 'b.engine', 'b.bodyStyle', 'b.carInfo', 'c.name as buyer_name', 'c.phone as buyer_phone','c.address as buyer_address', 'p.soldDate', 'p.depositDate', 'p.paidDate', 'p.collectedDate', 'p.id as part_transaction_id'],
    fieldEq: [
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'a.disassemblyCategory', requestParam: 'disassemblyCategory' },
      { column: 'a.disassemblyNumber', requestParam: 'disassemblyNumber' },
      { column: 'b.model', requestParam: 'model' },
      { column: 'b.departmentId', requestParam: 'departmentId' },
      { column: 'b.year', requestParam: 'year' },
      { column: 'b.brand', requestParam: 'brand' },
      { column: 'a.containerID', requestParam: 'containerID' },
      { column: 'a.containerNumber', requestParam: 'containerNumber' },
      { column: 'a.collected', requestParam: 'collected' },
    ],
    join: [{
      entity: CarEntity,
      alias: 'b',
      condition: 'a.carID = b.id',
      type: 'leftJoin'
    },{
      entity: BuyerEntity,
      alias: 'c',
      condition: 'a.buyerID = c.id',
      type: 'leftJoin'
    },{
      entity: PartTransactionsEntity,
      alias: 'p',
      condition: 'a.id = p.carWreckedID and p.status = 0',
      type: 'leftJoin'
    }],
    addOrderBy: (ctx) => {
      const { lowestSoldPrice, highestSoldPrice } = ctx.request.body;
      if(lowestSoldPrice || highestSoldPrice) {
        return {
          paid: "ASC"
        }
      }
    },
    async where(ctx) {
      const { isSold, isPaid, isDeposit, noSold, noPaid, noDeposit, lowestSoldPrice, highestSoldPrice, containerNumber, keyWord, } = ctx.request.body;
      // 因为根据分类排序了，所以会导致就算是后端列表排序了也会打乱顺序
      let hightSqlSearch = '';
      let lowestSqlSearch = '';
      if(lowestSoldPrice || highestSoldPrice) { 
        const hightSql = 'a.sold = (select MAX(sold) from `cool-admin`.car_wrecked';
        const lowestSql = 'a.sold = (select MIN(sold) from `cool-admin`.car_wrecked';
        const sqlArr = [];
        if(containerNumber) {
          sqlArr.push(`containerNumber = '${containerNumber}'`);
        }
        if(keyWord) {
          sqlArr.push(`(carID LIKE '%${keyWord}%' OR disassemblyNumber LIKE '%${keyWord}%' OR disassmblingInformation LIKE '%${keyWord}%' OR disassemblyDescription LIKE '%${keyWord}%')`);
        }
        hightSqlSearch = hightSql + (sqlArr.length > 0 ? ' where ' : '') + sqlArr.join(' and ') + ')';
        lowestSqlSearch = lowestSql + (sqlArr.length > 0 ? ' where ' : '') + sqlArr.join(' and ') + ')';
      }
      return [
        isSold ? ['a.sold IS NOT NULL AND a.sold > 0', {}]:[],
        isPaid ? ['a.paid IS NOT NULL AND a.paid > 0', {}]:[],
        isDeposit ? ['a.deposit IS NOT NULL AND a.deposit > 0', {}]:[],
        noSold ? ['(a.sold IS NULL OR a.sold = 0)', {}] : [],
        noPaid ? ['(a.paid IS NULL OR a.paid = 0)', {}] : [],
        noDeposit ? ['(a.deposit IS NULL OR a.deposit = 0)', {}] : [],
        lowestSoldPrice ? [lowestSqlSearch, {}
        ] : [],
        highestSoldPrice ? [hightSqlSearch, {}
        ] : [],
      ]
    },
  },
  listQueryOp: {
    keyWordLikeFields: ['carID'],
    select: ['a.*', 'b.model', 'b.year', 'b.brand', 'b.colour', 'b.vinNumber', 'b.name', 'b.registrationNumber', 'b.state', 'b.series', 'b.engine', 'b.bodyStyle', 'b.carInfo'],
    fieldEq: [
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'a.disassemblyCategory', requestParam: 'disassemblyCategory' },
      { column: 'a.disassemblyNumber', requestParam: 'disassemblyNumber' },
      { column: 'a.catalyticConverterNumber', requestParam: 'catalyticConverterNumber' },
      { column: 'b.model', requestParam: 'model' },
      { column: 'b.departmentId', requestParam: 'departmentId' },
      { column: 'b.year', requestParam: 'year' },
      { column: 'b.brand', requestParam: 'brand' },
      { column: 'a.containerID', requestParam: 'containerID' },
      { column: 'a.containerNumber', requestParam: 'containerNumber' },
      { column: 'a.collected', requestParam: 'collected' },
    ],
    join: [{
      entity: CarEntity,
      alias: 'b',
      condition: 'a.carID = b.id',
      type: 'leftJoin'
    }]
  },
  service: CarWreckedService
})

export class CarWreckedController extends BaseController {
  @InjectEntityModel(CarWreckedEntity)
  vehicleProfileEntity: Repository<CarWreckedEntity>

  @Inject()
  carWreckedService: CarWreckedService;

  @Inject()
  carBaseService: CarBaseService;

  @Post("/moveOutFromContainer")
  async moveOutFromContainer(@Body('partId') partId: number, @Body('containerNumber') containerNumber: string,) {
    try {
      await this.carWreckedService.moveOutFromContainer(partId, containerNumber);
      return this.ok();
    } catch(e) {
      return this.fail(e);
    }
  }

  @Post("/putToContainer")
  async putToContainer(@Body('id') id: number, @Body('containerNumber') containerNumber: string,) {
    try { await this.carWreckedService.putToContainer(id, containerNumber); return this.ok() } catch (e) {
      return this.fail(e);
    }
  }

  @Post("/infoByDn")
  async infoByDn(@Body('partId') partId: string) {
    const infoData = await this.carWreckedService.infoByDn(partId);
    if (infoData) {
      return this.ok(infoData);
    } else {
      return this.fail();
    }
  }

  @Post("/handleDisassemble")
  async handleDisassemble(@Body('info') info: any) {
    try {
      await this.carWreckedService.handleDisassemble(info);
      await this.carBaseService.changeCarStatus(3, info.carID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post("/handleToGetCarWreckedTotal")
  async handleToGetCarWreckedTotal(@Body('isSold') isSold: boolean, @Body('isPaid') isPaid: boolean, @Body('collected') collected: boolean, @Body('isDeposit') isDeposit: boolean, @Body('noSold') noSold: boolean,
  @Body('noPaid') noPaid: boolean,  @Body('noDeposit') noDeposit: boolean,  @Body('lowestSoldPrice') lowestSoldPrice: boolean,  @Body('containerNumber') containerNumber: string, @Body('highestSoldPrice') highestSoldPrice: boolean, @Body('keyWord') keyWord: string,
  ) {
    const filters = {
      isSold, isPaid, collected, isDeposit, containerNumber,  noSold, noPaid, noDeposit, lowestSoldPrice, highestSoldPrice, keyWord
    }
    try {
      const data = await this.carWreckedService.handleToGetCarWreckedTotal(filters);
      return this.ok(data);
    } catch(e) {
      return this.fail(e);
    }
  }

  @Post("/updateAndInsertLog")
  async updateAndInsertLog(@Body() params) { 
    try {
      const result = await this.carWreckedService.updateAndInsertLog(params);
      return this.ok(result);
    } catch(e) {
      return this.fail(e);
    }
  }

  @Get("/getCarWreckedWidthTransaction")
  async getCarWreckedWidthTransaction(@Query('id') id: number) {
    const carWreckedInfo = await this.carWreckedService.getCarWreckedWidthTransaction(id);
    if(carWreckedInfo) return this.ok(carWreckedInfo);
    return this.fail();
  }

}
