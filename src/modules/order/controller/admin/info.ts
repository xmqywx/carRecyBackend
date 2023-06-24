import {Body, Post, Provide, Inject} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import {Repository} from "typeorm";
import {InjectEntityModel} from "@midwayjs/orm";
import {OrderInfoEntity} from "../../entity/info";
import {CustomerProfileEntity} from "../../../customer/entity/profile";
import {CarEntity} from "../../../car/entity/base";
import {OrderActionEntity} from "../../entity/action";
import axios from 'axios';
import * as xml2json from  'xml2json';
import {CarRegEntity} from "../../../carReg/entity/info";
import {JobEntity} from "../../../job/entity/info";
import { startOfDay, endOfDay } from 'date-fns';
import { Between } from "typeorm";
import {OrderService} from "../../service/order";
import { BaseSysUserEntity } from '../../../base/entity/sys/user';
// import nodemailer from 'nodemailer';



/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: OrderInfoEntity,
  listQueryOp: {
    keyWordLikeFields: [
      'firstName',
      'surname', 'c.name', 'model', 'year', 'brand'],
    select: [
      'a.*',
      'b.firstName',
      'b.surname',
      'b.phoneNumber',
      'b.secNumber',
      'b.emailAddress',
      'b.address',
      'b.licence',
      'b.abn',
      'b.workLocation',
      'c.model',
      'c.registrationNumber',
      'c.state',
      'c.year',
      'c.brand',
      'c.colour',
      'c.vinNumber',
      'c.series',
      'c.engine',
      'c.name',
      'c.bodyStyle',
      'c.image',
      'c.identificationSighted',
      'c.registered',
      'c.platesReturned',
      'c.carInfo',
    ],
    // 多表关联，请求筛选字段与表字段不一致的情况
    fieldEq: [
      { column: 'a.createTime', requestParam: 'createTime' },
      { column: 'a.departmentId', requestParam: 'departmentId' },
      { column: 'a.customerID', requestParam: 'customerID' },
      { column: 'a.status', requestParam: 'status' },
      { column: 'a.id', requestParam: 'id'},
    ],
    join: [{
      entity: CustomerProfileEntity,
      alias: 'b',
      condition: 'a.customerID = b.id',
      type: 'leftJoin'
    }, {
      entity: CarEntity,
      alias: 'c',
      condition: 'a.carID = c.id',
      type: 'leftJoin'
    },{
      entity: BaseSysUserEntity,
      alias: 'd',
      condition: 'a.driverID = d.id',
      type: 'leftJoin'
    },{
      entity: JobEntity,
      alias: 'e',
      condition: 'a.id = e.orderID',
    }],
    where:  async (ctx) => {
      const { startDate, endDate, isPaid, notSchedule, searchRegistrationNumber } = ctx.request.body;
      return [
        isPaid ? ['a.actualPaymentPrice > :actualPaymentPrice and e.status = 4', {actualPaymentPrice: 0}]:[],
        startDate ? ['a.createTime >= :startDate', {startDate: startDate}] : [],
        endDate ? ['a.createTime <= :endDate', {endDate: endDate}]:[],
        notSchedule ? ['e.driverID IS NULL', {}]: [],
        searchRegistrationNumber ? ['c.registrationNumber LIKE :registrationNumber', {registrationNumber: `%${searchRegistrationNumber}%`}]: [],
      ]
    },
  },
  pageQueryOp: {
    keyWordLikeFields: [
      'firstName',
      'surname', 'c.name', 'model', 'year', 'brand'],
    select: [
      'a.*',
      'b.firstName',
      'b.surname',
      'b.phoneNumber',
      'b.secNumber',
      'b.emailAddress',
      'b.address',
      'b.licence',
      'b.abn',
      'b.workLocation',
      'c.model',
      'c.registrationNumber',
      'c.state',
      'c.year',
      'c.brand',
      'c.colour',
      'c.vinNumber',
      'c.series',
      'c.engine',
      'c.name',
      'c.bodyStyle',
      'c.image',
      'c.identificationSighted',
      'c.registered',
      'c.platesReturned',
      'c.carInfo',
      'e.status as job_status'
    ],
    // 多表关联，请求筛选字段与表字段不一致的情况
    fieldEq: [
      { column: 'a.createTime', requestParam: 'createTime' },
      { column: 'a.departmentId', requestParam: 'departmentId' },
      { column: 'a.customerID', requestParam: 'customerID' },
      { column: 'a.status', requestParam: 'status' },
      { column: 'a.id', requestParam: 'id'}
    ],
    join: [{
      entity: CustomerProfileEntity,
      alias: 'b',
      condition: 'a.customerID = b.id',
      type: 'leftJoin'
    }, {
      entity: CarEntity,
      alias: 'c',
      condition: 'a.carID = c.id',
      type: 'leftJoin'
    },{
      entity: BaseSysUserEntity,
      alias: 'd',
      condition: 'a.driverID = d.id',
      type: 'leftJoin'
    },{
      entity: JobEntity,
      alias: 'e',
      condition: 'a.id = e.orderID',
    }],
    where:  async (ctx) => {
      const { startDate, endDate, isPaid, notSchedule } = ctx.request.body;
      return [
        isPaid ? ['a.actualPaymentPrice > :actualPaymentPrice and e.status = 4', {actualPaymentPrice: 0}]:[],
        startDate ? ['a.createTime >= :startDate', {startDate: startDate}] : [],
        endDate ? ['a.createTime <= :endDate', {endDate: endDate}]:[],
        notSchedule ? ['e.driverID IS NULL', {}]: []
      ]
    },
  },
  service: OrderService

})

// @Post('/sendEmail')
// async sendEmail(@Body('name') name: string, @Body('number') number: string, @Body('price') price: number) {
//   const info = await main({name, number, price});
//   return this.ok({info});
// }

export class VehicleProfileController extends BaseController {
  @Inject()
  orderService: OrderService;
  @InjectEntityModel(OrderInfoEntity)
  orderInfoEntity: Repository<OrderInfoEntity>;
  @InjectEntityModel(JobEntity)
  jobEntity: Repository<JobEntity>;
  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;
  @InjectEntityModel(OrderActionEntity)
  orderActionEntity: Repository<OrderActionEntity>;
  @InjectEntityModel(CarRegEntity)
  carRegEntity: Repository<CarRegEntity>;

  @Post('/getCountBooking')
  async getCountBooking(@Body('status') status: number,
                        @Body('departmentId') departmentId: number){
    const count = await this.orderInfoEntity.count({
      where: {
        status,
        departmentId
      }
    })
    const countDay = await this.orderInfoEntity.count({
      where: {
        status,
        departmentId,
        createTime:Between(startOfDay(new Date()).toISOString(), endOfDay(new Date()).toISOString()),
      }
    })
    return {
      count,
      countDay
    }
  }
  @Post('/getCountJob')
  async getCountJob(@Body('status') status: number,
                        @Body('departmentId') departmentId: number){
    const filter: any = {}
    if (status != undefined) {
      filter.status = status;
    }
    filter.departmentId = departmentId
    // if (status != undefined) {
    //   filter.departmentId = departmentId;
    // }
    const count = await this.jobEntity.count({
      where: filter
    })
    return this.ok(count)
  }

  @Post('/getCountMonth')
  async getCountMonth(@Body('status') status: number,
                        @Body('departmentId') departmentId: number){
    const list = await this.orderService.getCountMonth(departmentId);
    return this.ok(list)
  }


  @Post('/getCarInfo')
  async getCarInfo(@Body('registrationNumber') registrationNumber: string,
                   @Body('state') state: string) {
    const carRegList = await this.carRegEntity.find({
      registrationNumber,
      state
    });
    if (carRegList.length) {
      const carString = xml2json.toJson(carRegList[0].xml);
      let json = JSON.parse(carString);
      const vehicleJson = json.Vehicle.vehicleJson
      return this.ok(JSON.parse(vehicleJson))
    }
    try {
      const data = await axios.get('http://www.carregistrationapi.com/api/reg.asmx/CheckAustralia', {
        params:{
          RegistrationNumber: registrationNumber,
          State: state,
          username:'smtm2099',
        }
      }).then(async (res) => {
        await this.carRegEntity.save({
          registrationNumber,
          state,
          xml: res.data
        });
        return xml2json.toJson(res.data);
      });
      let json = JSON.parse(data);
      const vehicleJson = json.Vehicle.vehicleJson
      return this.ok(JSON.parse(vehicleJson));
    } catch (e) {
      return this.fail('Unable to obtain correct vehicle information')
    }
  }

  @Post('/getcredits')
  async getCredits(){
    const data = await axios.get('https://www.regcheck.org.uk/ajax/getcredits.aspx?username=smtm2099');
    console.log(data.data);
    if(data.data !== null) {
      return this.ok(data.data);
    } else {
      return this.fail();
    }
  }

}
