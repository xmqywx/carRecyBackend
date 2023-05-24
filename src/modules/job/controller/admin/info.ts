import {Body, Post, Provide} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import {Repository} from "typeorm";
import {InjectEntityModel} from "@midwayjs/orm";
import {JobEntity} from "../../entity/info";
import {CarEntity} from "../../../car/entity/base";
import {BaseSysUserEntity} from "../../../base/entity/sys/user";
import {OrderInfoEntity} from "../../../order/entity/info";
import {CustomerProfileEntity} from "../../../customer/entity/profile";

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: JobEntity,

  listQueryOp: {
    keyWordLikeFields: ['a.*','c.name','c.model','c.year',  'b.pickupAddress', 'b.pickupAddressState', 'd.username'],
    select: [
      'a.*',
      'b.expectedDate',
      'b.pickupAddress',
      'b.pickupAddressState',
      'c.name', 'c.model', 'c.year',
      'c.brand', 'c.colour', 'c.vinNumber',
      'c.series', 'c.engine', 'c.image',
      'e.phoneNumber','e.firstName'],
    // 多表关联，请求筛选字段与表字段不一致的情况
    fieldEq: [
      { column: 'a.createTime', requestParam: 'createTime' },
      { column: 'a.status', requestParam: 'status' },
      { column: 'a.driverID', requestParam: 'driverID' },
      { column: 'a.departmentId', requestParam: 'departmentId' },
      { column: 'a.id', requestParam: 'id' },
      { column: 'a.orderID', requestParam: 'orderID' },
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
    }, {
      entity: CustomerProfileEntity,
      alias: 'e',
      condition: 'b.customerID = e.id',
      type: 'leftJoin'
    }],
    where:  async (ctx) => {
      const { startDate, endDate, status } = ctx.request.body;
      if (status === 0) {
        return [
          ['a.status != :status', {status  : 5}],
          startDate ? ['a.updateTime >= :startDate', {startDate: new Date(startDate)}] : [],
          endDate ? ['a.updateTime <= :endDate', {endDate: new Date(endDate)}]:[],
        ]
      } else {
        return [
          ['a.status != :status', {status  : 5}],
          startDate ? ['a.schedulerStart >= :startDate', {startDate: startDate}] : [],
          endDate ? ['a.schedulerStart <= :endDate', {endDate: endDate}]:[],
        ]
      }
    },
  },
  pageQueryOp: {
    keyWordLikeFields: ['a.*','c.name','c.model','c.year',  'b.pickupAddress', 'b.pickupAddressState', 'd.username'],
    select: ['a.*', 'b.expectedDate', 'b.pickupAddress', 'b.pickupAddressState','b.pickupAddressLat','b.pickupAddressLng', 'c.model', 'c.year', 'c.brand', 'c.colour', 'c.vinNumber', 'd.username'],
    // 多表关联，请求筛选字段与表字段不一致的情况
    fieldEq: [
      { column: 'a.createTime', requestParam: 'createTime' },
      { column: 'a.status', requestParam: 'status' },
      { column: 'a.departmentId', requestParam: 'departmentId' },
      { column: 'a.driverID', requestParam: 'driverID' },
      { column: 'a.orderID', requestParam: 'orderID' },
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
          ['a.status != :status', {status  : 5}],
          startDate ? ['a.updateTime >= :startDate', {startDate: new Date(startDate)}] : [],
          endDate ? ['a.updateTime <= :endDate', {endDate: new Date(endDate)}]:[],
        ]
      } else {
        return [
          ['a.status != :status', {status  : 5}],
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

  @Post('/updateJob')
  async updateJob(@Body('orderID') orderID: number, @Body('status') status: number){
    await this.jobEntity.update({
      orderID
    }, {
      status
    });
  }

}
