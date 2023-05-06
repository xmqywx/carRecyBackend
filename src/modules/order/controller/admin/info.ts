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
import main from '../../../sendEmail/index';
// import nodemailer from 'nodemailer';



/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: OrderInfoEntity,

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
      { column: 'a.status', requestParam: 'status' },
      {column: 'a.id', requestParam: 'id'}
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
    },],
    where:  async (ctx) => {
      const { startDate, endDate, isPaid } = ctx.request.body;
      return [
        isPaid ? ['a.actualPaymentPrice > :actualPaymentPrice', {actualPaymentPrice: 0}]:[],
        startDate ? ['a.createTime >= :startDate', {startDate: startDate}] : [],
        endDate ? ['a.createTime <= :endDate', {endDate: endDate}]:[],
      ]
    },
  },
  
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

// // 使用async..await 创建执行函数
// async function main() {
//   // 如果你没有一个真实邮箱的话可以使用该方法创建一个测试邮箱
 
//   // 创建Nodemailer传输器 SMTP 或者 其他 运输机制
//   let transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com", // 第三方邮箱的主机地址
//     port: 465,
//     secure: true, // true for 465, false for other ports
//     auth: {
//       user: "laurentliu0918@gmail.com", // 发送方邮箱的账号
//       pass: "qxtevaozxibvalxj", // 邮箱授权密码
//     },
//   });
//   // 定义transport对象并发送邮件
//   const receiver = {
//     from: '"Dooring ????" laurentliu0918@gmail.com', // 发送方邮箱的账号
//     to: "480946994@qq.com", // 邮箱接受者的账号
//     subject: "Hello Dooring", // Subject line
//     text: "H5-Dooring?", // 文本内容
//     html: "欢迎注册h5.dooring.cn, 您的邮箱验证码是:<b>aaaaaaaaaaaaaaaa</b>", // html 内容, 如果设置了html内容, 将忽略text内容
//   };
//   let info = await transporter.sendMail(receiver,(error,info) => {
//     if (error) {
//       return console.log('发送失败:', error);
//   }
//   transporter.close()
//   console.log('发送成功:', info.response)


//   });
// }

