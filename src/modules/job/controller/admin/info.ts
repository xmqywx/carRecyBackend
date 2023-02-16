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
    select: ['a.*', 'b.expectedDate', 'b.pickupAddress', 'c.name', 'c.model', 'c.year', 'c.brand', 'c.colour', 'c.vinNumber', 'c.series', 'c.engine', 'c.image'],
    // 多表关联，请求筛选字段与表字段不一致的情况
    fieldEq: [
      { column: 'a.createTime', requestParam: 'createTime' },
      { column: 'a.status', requestParam: 'status' },
      { column: 'a.departmentId', requestParam: 'departmentId' },
    ],
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
    fieldEq: [
      { column: 'a.createTime', requestParam: 'createTime' },
      { column: 'a.status', requestParam: 'status' },
      { column: 'a.departmentId', requestParam: 'departmentId' },
    ],
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
    where:  async (ctx) => {
      const { startDate, endDate, status } = ctx.request.body;
      if (status === 0) {
        return [
          startDate ? ['a.updateTime >= :startDate', {startDate: new Date(startDate)}] : [],
          endDate ? ['a.updateTime <= :endDate', {endDate: new Date(endDate)}]:[],
        ]
      } else {
        return [
          startDate ? ['a.schedulerStart >= :startDate', {startDate: startDate}] : [],
          endDate ? ['a.schedulerStart <= :endDate', {endDate: endDate}]:[],
        ]
      }
    },
  },
})
export class VehicleProfileController extends BaseController {
  @InjectEntityModel(JobEntity)
  jobEntity: Repository<JobEntity>;
  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;
}
