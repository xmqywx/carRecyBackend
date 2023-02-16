import {Body, Post, Provide} from '@midwayjs/decorator';
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
/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: OrderInfoEntity,

  pageQueryOp: {
    keyWordLikeFields: ['firstName', 'surname', 'name', 'model', 'year', 'brand'],
    select: [
      'a.*',
      'b.firstName',
      'b.surname',
      'b.phoneNumber',
      'b.emailAddress',
      'b.address',
      'b.licence',
      'c.model',
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
    ],
    // 多表关联，请求筛选字段与表字段不一致的情况
    fieldEq: [
      { column: 'a.createTime', requestParam: 'createTime' },
      { column: 'a.departmentId', requestParam: 'departmentId' },
      { column: 'a.status', requestParam: 'status' }],
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
    }],
    where:  async (ctx) => {
      const { startDate, endDate } = ctx.request.body;
      return [
        startDate ? ['a.createTime >= :startDate', {startDate: startDate}] : [],
        endDate ? ['a.createTime <= :endDate', {endDate: endDate}]:[],
      ]
    },
  },
})
export class VehicleProfileController extends BaseController {
  @InjectEntityModel(OrderInfoEntity)
  orderInfoEntity: Repository<OrderInfoEntity>;
  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;
  @InjectEntityModel(OrderActionEntity)
  orderActionEntity: Repository<OrderActionEntity>;
  @InjectEntityModel(CarRegEntity)
  carRegEntity: Repository<CarRegEntity>;
  @Post('/getCarInfo', { summary: '停止' })
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
          username:'wepickyourcar',
        }
      }).then(async (res) => {
        await this.carRegEntity.save({
          registrationNumber,
          state,
          xml: res.data
        });

        // console.log(xml2json.toJson(res.data))
        return xml2json.toJson(res.data);
      });
      let json = JSON.parse(data);
      const vehicleJson = json.Vehicle.vehicleJson
      // console.log(JSON.parse(vehicleJson))
      return this.ok(JSON.parse(vehicleJson));
    } catch (e) {
      return this.fail('Unable to obtain correct vehicle information')
    }
  }

}
