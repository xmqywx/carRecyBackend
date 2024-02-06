import {Provide, Get, Query, Inject} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import {CarEntity} from "../../entity/base";
import { OrderInfoEntity } from '../../../order/entity/info';
import { JobEntity } from '../../../job/entity/info';
import {Repository} from "typeorm";
import {InjectEntityModel} from "@midwayjs/orm";
import { CarBaseService, CarWreckedService } from '../../service/car';
/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CarEntity,

  listQueryOp: {
    keyWordLikeFields: ['a.name', 'a.year', 'a.departmentId'],
    fieldEq: ['a.name', 'a.year', 'a.customerID', 'a.departmentId'],
  },

  pageQueryOp: {
    keyWordLikeFields: ['a.name', 'a.year', 'a.registrationNumber', 'a.state'],
    select: [
      'a.*',
      'b.modelNumber',
      'b.carColor',
      'b.actualPaymentPrice',
      'b.imageFileDir',
      'b.paymentRemittance',
      'b.payMethod',
      'b.deposit',
      'b.depositPayMethod',
      'b.deduction',
      'b.gstStatus',
      'b.gstAmount',
      'b.id as orderID',
      'b.createBy',
      'b.pickupAddress',
      'b.expectedDate'
      // 'b.catalyticConverterPhotos'
    ],
    fieldEq: [
      { column: 'a.createTime', requestParam: 'createTime' },
      { column: 'a.departmentId', requestParam: 'departmentId' },
      { column: 'a.id', requestParam: 'id'},
      { column: 'a.isVFP', requestParam: 'isVFP'},
      { column: 'a.status', requestParam: 'status'}
    ],
    join: [{
      entity: OrderInfoEntity,
      alias: 'b',
      condition: 'a.id = b.carID',
      type: 'leftJoin'
    },{
      entity: JobEntity,
      alias: 'c',
      condition: 'c.orderID = b.id',
    }],
    where:  async (ctx) => {
      const { isCompleted } = ctx.request.body;
      return [
        isCompleted ? ['c.status = 4', {}]:[], 
        // isVFP ? ['a.isVFP = true', {}] : ['(a.isVFP is NULL or a.isVFP = false)', {}]
        // isCompleted ? ['b.actualPaymentPrice > :actualPaymentPrice and c.status = 4', {actualPaymentPrice: 0}]:[],
      ]
    },
  },
})
export class CarBaseController extends BaseController {
  @InjectEntityModel(CarEntity)
  vehicleProfileEntity: Repository<CarEntity>

  @Inject()
  carBaseService: CarBaseService;

  @Inject()
  carWreckedService: CarWreckedService;

  @Get("/get_number")
  async getNumber(@Query('catalyticConverterNumber') catalyticConverterNumber: string) {
    const wrekcedRes = await this.carWreckedService.getWreckedNumber(catalyticConverterNumber);
    const carRes = await this.carBaseService.getNumber(catalyticConverterNumber);
    return [...wrekcedRes, ...carRes]
  }

  @Get("/getCarInfoWidthOrder")
  async getCarInfoWidthOrder(@Query('id') id: number) {
    const carInfo = await this.carBaseService.getCarInfoWidthOrder(id);
    if(carInfo) return this.ok(carInfo);
    return this.fail();
  }
}
