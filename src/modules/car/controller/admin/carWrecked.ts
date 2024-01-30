import { Provide, Post, Inject, Body } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { CarWreckedEntity } from "../../entity/carWrecked";
import { CarEntity } from "../../entity/base";
import { Repository } from "typeorm";
import { InjectEntityModel } from "@midwayjs/orm";
import { CarWreckedService, CarBaseService } from '../../service/car';

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CarWreckedEntity,
  pageQueryOp: {
    keyWordLikeFields: ['carID', 'disassemblyNumber', 'disassmblingInformation', 'disassemblyDescription'],
    select: ['a.*', 'b.model', 'b.year', 'b.brand', 'b.colour', 'b.vinNumber', 'b.name', 'b.registrationNumber', 'b.state', 'b.series', 'b.engine', 'b.bodyStyle', 'b.carInfo'],
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
    }],
    addOrderBy: (ctx) => {
      const { lowestSoldPrice, highestSoldPrice } = ctx.request.body;
      if(lowestSoldPrice || highestSoldPrice) {
        return {
          paid: "ASC"
        }
      }
    },
    where:  async (ctx) => {
      const { isSold, isPaid, isDeposit, noSold, noPaid, noDeposit, lowestSoldPrice, highestSoldPrice } = ctx.request.body;
      console.log(ctx.request.body, '====================')
      if(lowestSoldPrice || highestSoldPrice) {
        ctx.request.body.orderBy = {
          paid: "ASC"
        }
      }
      return [
        isSold ? ['a.sold IS NOT NULL AND a.sold > 0', {}]:[],
        isPaid ? ['a.paid IS NOT NULL AND a.paid > 0', {}]:[],
        isDeposit ? ['a.deposit IS NOT NULL AND a.deposit > 0', {}]:[],
        noSold ? ['(a.sold IS NULL OR a.sold = 0)', {}] : [],
        noPaid ? ['(a.paid IS NULL OR a.paid = 0)', {}] : [],
        noDeposit ? ['(a.deposit IS NULL OR a.deposit = 0)', {}] : [],
        // lowestSoldPrice ? ['a.paid IN (SELECT MIN(paid) FROM a)', {}] : [],
        // highestSoldPrice ? ['a.paid IN (SELECT MAX(paid) FROM a)', {}] : [],
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
  @Body('noPaid') noPaid: boolean,  @Body('noDeposit') noDeposit: boolean,  @Body('lowestSoldPrice') lowestSoldPrice: boolean,  @Body('containerNumber') containerNumber: string, @Body('highestSoldPrice') highestSoldPrice: boolean,
  ) {
    const filters = {
      isSold, isPaid, collected, isDeposit, containerNumber,  noSold, noPaid, noDeposit, lowestSoldPrice, highestSoldPrice
    }
    try {
      const data = await this.carWreckedService.handleToGetCarWreckedTotal(filters);
      return this.ok(data);
    } catch(e) {
      return this.fail(e);
    }
  }

}
