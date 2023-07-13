import {Provide} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import {CarEntity} from "../../entity/base";
import { OrderInfoEntity } from '../../../order/entity/info';
import { JobEntity } from '../../../job/entity/info';
import {Repository} from "typeorm";
import {InjectEntityModel} from "@midwayjs/orm";


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
    keyWordLikeFields: ['a.name', 'a.year', 'a.departmentId'],
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
      'b.createTime as orderCreateTime',
      'b.createBy',
      'b.pickupAddress'
      // 'b.catalyticConverterPhotos'
    ],
    fieldEq: [
      { column: 'a.createTime', requestParam: 'createTime' },
      { column: 'a.departmentId', requestParam: 'departmentId' },
      { column: 'a.isVFP', requestParam: 'isVFP' },
      { column: 'a.id', requestParam: 'id'}
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
        // isCompleted ? ['b.actualPaymentPrice > :actualPaymentPrice and c.status = 4', {actualPaymentPrice: 0}]:[],
      ]
    },
  },
})
export class CarBaseController extends BaseController {
  @InjectEntityModel(CarEntity)
  vehicleProfileEntity: Repository<CarEntity>
}
