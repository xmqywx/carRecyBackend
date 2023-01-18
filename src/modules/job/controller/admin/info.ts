import {Provide} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import {Repository} from "typeorm";
import {InjectEntityModel} from "@midwayjs/orm";
import {JobEntity} from "../../entity/info";
import {CarEntity} from "../../../car/entity/base";
import {BaseSysUserEntity} from "../../../base/entity/sys/user";
import {OrderInfoEntity} from "../../../order/entity/info";

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: JobEntity,

  listQueryOp: {
    keyWordLikeFields: ['customerID'],
    select: ['a.*', 'b.expectedDate', 'b.pickupAddress', 'c.model', 'c.year', 'c.brand', 'c.colour', 'c.vinNumber'],
    // 多表关联，请求筛选字段与表字段不一致的情况
    fieldEq: [{ column: 'a.createTime', requestParam: 'createTime' },{ column: 'a.status', requestParam: 'status' },{ column: 'b.expectedDate', requestParam: 'expectedDate' }],
    join: [{
      entity: OrderInfoEntity,
      alias: 'b',
      condition: 'a.orderID = b.id',
      type: 'leftJoin'
    }, {
      entity: CarEntity,
      alias: 'c',
      condition: 'b.carID = c.id',
      type: 'leftJoin'
    }, {
      entity: BaseSysUserEntity,
      alias: 'd',
      condition: 'a.driverID = d.id',
      type: 'leftJoin'
    }],

  },
  pageQueryOp: {
    keyWordLikeFields: ['customerID'],
    select: ['a.*', 'b.expectedDate', 'b.pickupAddress', 'c.model', 'c.year', 'c.brand', 'c.colour', 'c.vinNumber', 'd.username'],
    // 多表关联，请求筛选字段与表字段不一致的情况
    fieldEq: [{ column: 'a.createTime', requestParam: 'createTime' },{ column: 'a.status', requestParam: 'status' },{ column: 'b.expectedDate', requestParam: 'expectedDate' }],
    join: [{
      entity: OrderInfoEntity,
      alias: 'b',
      condition: 'a.orderID = b.id',
      type: 'leftJoin'
    }, {
      entity: CarEntity,
      alias: 'c',
      condition: 'b.carID = c.id',
      type: 'leftJoin'
    }, {
      entity: BaseSysUserEntity,
      alias: 'd',
      condition: 'a.driverID = d.id',
      type: 'leftJoin'
    }],
    // where:  async (ctx: Context) => {
    //   const { date } = ctx.request.body;
    //   return [
    //     model ? ['model like :model', {model: `%${model}%`}] : [],
    //     brand ? ['brand like :brand', {brand: `%${brand}%`}]:[],
    //   ]
    //
    // },
  },
})
export class VehicleProfileController extends BaseController {
  @InjectEntityModel(JobEntity)
  jobEntity: Repository<JobEntity>;
  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;
}
