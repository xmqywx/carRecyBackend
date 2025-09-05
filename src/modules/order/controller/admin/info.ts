import { Body, Post, Provide, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/orm';
import { OrderInfoEntity } from '../../entity/info';
import { CustomerProfileEntity } from '../../../customer/entity/profile';
import { CarEntity } from '../../../car/entity/base';
import { OrderActionEntity } from '../../entity/action';
import axios from 'axios';
import { CarRegEntity } from '../../../carReg/entity/info';
import { JobEntity } from '../../../job/entity/info';
import { startOfDay, endOfDay } from 'date-fns';
import { Between } from 'typeorm';
import { OrderService } from '../../service/order';
import { BaseSysUserEntity } from '../../../base/entity/sys/user';
import * as xml2json from 'xml2json';

/**
 * 订单信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: OrderInfoEntity,
  listQueryOp: {
    keyWordLikeFields: [
      'firstName',
      'surname',
      'c.name',
      'model',
      'year',
      'brand',
    ],
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
      'b.licenseClass',
      'b.cardNumber',
      'b.expiryDate',
      'b.dateOfBirth',
      'b.backCardNumber',
      'b.customerAt',
      'c.model',
      'c.registrationNumber',
      'c.state',
      'c.year',
      'c.brand',
      'c.colour',
      'c.vinNumber',
      'c.series',
      'c.engine',
      'c.engineCode',
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
      { column: 'a.id', requestParam: 'id' },
    ],
    join: [
      {
        entity: CustomerProfileEntity,
        alias: 'b',
        condition: 'a.customerID = b.id',
        type: 'leftJoin',
      },
      {
        entity: CarEntity,
        alias: 'c',
        condition: 'a.carID = c.id',
        type: 'leftJoin',
      },
      {
        entity: BaseSysUserEntity,
        alias: 'd',
        condition: 'a.driverID = d.id',
        type: 'leftJoin',
      },
      {
        entity: JobEntity,
        alias: 'e',
        condition: 'a.id = e.orderID',
      },
    ],
    where: async ctx => {
      const {
        startDate,
        endDate,
        isPaid,
        notSchedule,
        searchRegistrationNumber,
      } = ctx.request.body;
      return [
        isPaid
          ? [
              'a.actualPaymentPrice > :actualPaymentPrice and e.status = 4',
              { actualPaymentPrice: 0 },
            ]
          : [],
        startDate
          ? ['a.createTime >= :startDate', { startDate: startDate }]
          : [],
        endDate ? ['a.createTime <= :endDate', { endDate: endDate }] : [],
        notSchedule ? ['e.driverID IS NULL', {}] : [],
        searchRegistrationNumber
          ? [
              'c.registrationNumber LIKE :registrationNumber',
              { registrationNumber: `%${searchRegistrationNumber}%` },
            ]
          : [],
      ];
    },
  },
  pageQueryOp: {
    keyWordLikeFields: [
      'firstName',
      'c.registrationNumber',
      'c.state',
      'surname',
      'c.name',
      'model',
      'year',
      'brand',
    ],
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
      'b.licenseClass',
      'b.cardNumber',
      'b.expiryDate',
      'b.dateOfBirth',
      'b.backCardNumber',
      'b.customerAt',
      'c.model',
      'c.registrationNumber',
      'c.state',
      'c.year',
      'c.brand',
      'c.colour',
      'c.vinNumber',
      'c.series',
      'c.engine',
      'c.engineCode',
      'c.name',
      'c.bodyStyle',
      'c.image',
      'c.identificationSighted',
      'c.registered',
      'c.platesReturned',
      'c.carInfo',
      'c.power',
      'c.fuel',
      'c.cylinders',
      'c.engineNumber',
      'c.transmission',
      'c.status as car_status',
      'e.status as job_status',
      'e.id as jobID',
    ],
    fieldEq: [
      { column: 'a.createTime', requestParam: 'createTime' },
      { column: 'a.payMethod', requestParam: 'payMethod' },
      { column: 'a.departmentId', requestParam: 'departmentId' },
      { column: 'a.customerID', requestParam: 'customerID' },
      { column: 'a.status', requestParam: 'status' },
      { column: 'a.id', requestParam: 'id' },
      { column: 'e.status', requestParam: 'job_status' },
    ],
    join: [
      {
        entity: CustomerProfileEntity,
        alias: 'b',
        condition: 'a.customerID = b.id',
        type: 'leftJoin',
      },
      {
        entity: CarEntity,
        alias: 'c',
        condition: 'a.carID = c.id',
        type: 'leftJoin',
      },
      {
        entity: BaseSysUserEntity,
        alias: 'd',
        condition: 'a.driverID = d.id',
        type: 'leftJoin',
      },
      {
        entity: JobEntity,
        alias: 'e',
        condition: 'a.id = e.orderID',
      },
    ],
    where: async ctx => {
      const { startDate, endDate, isPaid, notSchedule, keywordCustomer } =
        ctx.request.body;
      let isNotScheduleSearch = [];
      if (notSchedule !== undefined) {
        if (notSchedule === 0) {
          isNotScheduleSearch = [
            '(e.driverID IS NULL OR e.driverID IS NOT NULL)',
            {},
          ];
        } else if (notSchedule === 1) {
          isNotScheduleSearch = ['e.driverID IS NOT NULL', {}];
        } else if (notSchedule === 2) {
          isNotScheduleSearch = ['e.driverID IS NULL', {}];
        } else {
          isNotScheduleSearch = [];
        }
      } else {
        isNotScheduleSearch = [];
      }

      return [
        isPaid ? ['e.status = 4', {}] : [],
        startDate
          ? ['a.createTime >= :startDate', { startDate: startDate }]
          : [],
        endDate ? ['a.createTime <= :endDate', { endDate: endDate }] : [],
        isNotScheduleSearch,
        keywordCustomer
          ? [
              'b.firstName LIKE :keywordCustomer',
              { keywordCustomer: `%${keywordCustomer}%` },
            ]
          : [],
      ];
    },
  },
  service: OrderService,
})
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
  @InjectEntityModel(CustomerProfileEntity)
  customerProfileEntity: Repository<CustomerProfileEntity>;

  /**
   * 获取统计信息
   */
  @Post('/getCountBooking')
  async getCountBooking(
    @Body('status') status: number,
    @Body('departmentId') departmentId: number,
    @Body('startDate') startDate: Date,
    @Body('endDate') endDate: Date,
    @Body('jobComplete') jobComplete = false
  ) {
    if (jobComplete) {
      return this.orderService.getCountCompleteJob(
        departmentId,
        startDate,
        endDate,
        status
      );
    }
    const searchData: { [key: string]: any } = {
      departmentId,
    };
    if(status >= 0) {
      searchData. status = status;
    }
    if (startDate && endDate) {
      searchData.createTime = Between(startDate, endDate);
    }
    const count = await this.orderInfoEntity.count({
      where: searchData,
    });
    const countDay = await this.orderInfoEntity.count({
      where: {
        status,
        departmentId,
        createTime: Between(
          startOfDay(new Date()).toISOString(),
          endOfDay(new Date()).toISOString()
        ),
      },
    });
    return {
      count,
      countDay,
    };
  }

  /**
   * 获取统计信息
   */
  @Post('/getCountJob')
  async getCountJob(
    @Body('status') status: number,
    @Body('departmentId') departmentId: number,
    @Body('startDate') startDate: Date,
    @Body('endDate') endDate: Date
  ) {
    const filter: any = {};
    if (status != undefined) {
      filter.status = status;
    }
    if (startDate && endDate) {
      filter.updateTime = Between(startDate, endDate);
    }
    filter.departmentId = departmentId;
    const count = await this.jobEntity.count({
      where: filter,
    });
    return this.ok(count);
  }

  @Post('/getCountMonth')
  async getCountMonth(
    @Body('status') status: number,
    @Body('departmentId') departmentId: number
  ) {
    const list = await this.orderService.getCountMonth(departmentId);
    return this.ok(list);
  }

  @Post('/getCarInfo')
  async getCarInfo(
    @Body('registrationNumber') registrationNumber: string,
    @Body('state') state: string,
    @Body('vin') vin: string,
    @Body('api') api: number
  ) {
    if (!registrationNumber && !vin) {
      return this.fail('Registration number or VIN is required');
    }

    const carRegList = await this.carRegEntity.find({
      registrationNumber,
      vin
    });
    let carRegFind;
    if (carRegList.length) {
      carRegFind = carRegList[0].id ?? undefined;
    }
    if (api === SEARCH_CAR_API.S1) {
      if (carRegList.length && carRegList[0].xml) {
        const carString = xml2json.toJson(carRegList[0].xml);
        let json = JSON.parse(carString);
        const vehicleJson = json.Vehicle.vehicleJson;
        return this.ok(JSON.parse(vehicleJson));
      }
      try {
        const data = await this.orderService.fetchDataWithS1(
          registrationNumber,
          state
        );
        if (!data) {
          return this.fail('Unable to obtain content');
        }
        await this.carRegEntity.save({
          id: carRegFind,
          registrationNumber,
          state,
          vin,
          xml: data,
        });
        let handleData = xml2json.toJson(data);
        let json = JSON.parse(handleData);
        const vehicleJson = json.Vehicle.vehicleJson;
        return this.ok(JSON.parse(vehicleJson));
      } catch (e) {
        console.log(e.message);
        if (e.message === 'timeout of 8000ms exceeded') {
          return this.fail('This content cannot be found or does not exist.');
        }

        return this.fail(
          'Unable to obtain correct vehicle information,please try again later.'
        );
      }
    } else if (api === SEARCH_CAR_API.V1) {
      if (carRegList.length && carRegList[0].json) {
        return this.ok(carRegList[0].json);
      }

      try {
        let carRegFind;
        if (carRegList.length) {
          carRegFind = carRegList[0].id ?? undefined;
        }
        const res = await this.orderService.fetchDataWithV1(
          registrationNumber,
          state,
          vin
        );
        if(!res || !res.result) {
          return this.fail('Please try again later.');
        } else {
          if(res.result.responseCode !== 'SUCCESS') {
            return this.fail(res.result.description);
          }
        }
        let jsonData1 = res.result.vehicles[0] ?? null;

        if (!jsonData1) {
          return this.fail('This content cannot be found or does not exist.');
        }
        const jsonData = { ...jsonData1 };
        await this.carRegEntity.save({
          id: carRegFind,
          registrationNumber,
          state,
          vin,
          json: jsonData,
        });
        return this.ok(jsonData);
      } catch (e) {
        return this.fail(
          'Unable to obtain correct vehicle information,please try again later.'
        );
      }
    } else if (api === SEARCH_CAR_API.V2) {
      if (carRegList.length && carRegList[0].json_v2) {
        return this.ok(carRegList[0].json_v2);
      }
      try {
        let carRegFind;
        if (carRegList.length) {
          carRegFind = carRegList[0].id ?? undefined;
        }
        const res = await this.orderService.fetchDataWithV2(
          registrationNumber,
          state,
          vin
        );
        if(!res || !res.result) {
          return this.fail('Please try again later.');
        } else {
          if(res.result.responseCode !== 'SUCCESS') {
            return this.fail(res.result.description);
          }
        }
        let jsonData2 = res.result.vehicle ?? null;
        if (!jsonData2) {
          return this.fail('This content cannot be found or does not exist.');
        }
        const jsonData = { ...jsonData2 };
        await this.carRegEntity.save({
          id: carRegFind,
          registrationNumber,
          state,
          vin,
          json_v2: jsonData,
        });
        return this.ok(jsonData);
      } catch (e) {
        return this.fail(
          'Unable to obtain correct vehicle information,please try again later.'
        );
      }
    } else if (api === SEARCH_CAR_API.V3) {
      if (carRegList.length && carRegList[0].json_v3) {
        return this.ok(carRegList[0].json_v3);
      }
      try {
        const res = await this.orderService.fetchDataWithV3(
          registrationNumber,
          state,
          vin
        );
        if(!res || !res.result) {
          return this.fail('Please try again later.');
        } else {
          if(res.result.responseCode !== 'SUCCESS') {
            return this.fail(res.result.description);
          }
        }
        let jsonData2 = res?.result?.vehicle ?? null;
        if (!jsonData2) {
          return this.fail('This content cannot be found or does not exist.');
        }
        const jsonData = { ...jsonData2 };
        await this.carRegEntity.save({
          id: carRegFind,
          registrationNumber,
          state,
          vin,
          json_v3: jsonData,
        });
        return this.ok(jsonData);
      } catch (e) {
        return this.fail(
          'Unable to obtain correct vehicle information,please try again later.'
        );
      }
    } else {
      return this.fail('API type not supported.');
    }
  }

  @Post('/getcredits')
  async getCredits() {
    const data = await axios.get(
      'https://www.regcheck.org.uk/ajax/getcredits.aspx?username=smtm2099'
    );
    console.log(data.data);
    if (data.data !== null) {
      return this.ok(data.data);
    } else {
      return this.fail();
    }
  }

  @Post('/bookedUpdateStatus')
  async bookedUpdateStatus(
    @Body('orderId') orderId: number,
    @Body('order_status') order_status: number,
    @Body('job_status') job_status: number,
    @Body('job_info') job_info: JobInfo
  ) {
    const res = await this.orderService.bookedUpdateStatus(
      orderId,
      order_status,
      job_status,
      job_info
    );
    if (res) {
      return this.ok();
    } else {
      return this.fail();
    }
  }

  @Post('/getOrderInfo')
  async getOrderInfo(
    @Body('orderId') orderId: number,
  ) {
    let result = {};
    const orderInfo = await this.orderInfoEntity.findOne({id: orderId });
    const promise = [];
    let jobInfo;
    promise.push(this.jobEntity.findOne({orderID: orderId}).then(res => jobInfo = res));
    let carInfo;
    promise.push(this.carEntity.findOne({id: orderInfo.carID}).then(res => carInfo = res));
    let customerInfo;
    promise.push(this.customerProfileEntity.findOne({id: Number(orderInfo.customerID)}).then(res => customerInfo = res));
    try {
      await Promise.all(promise);
      result = Object.assign({
        firstName: customerInfo?.firstName,
        surname: customerInfo?.surname,
        phoneNumber: customerInfo?.phoneNumber,
        secNumber: customerInfo?.secNumber,
        emailAddress: customerInfo?.emailAddress,
        address: customerInfo?.address,
        licence: customerInfo?.licence,
        abn: customerInfo?.abn,
        workLocation: customerInfo?.workLocation,
        model: carInfo?.model,
        registrationNumber: carInfo?.registrationNumber,
        state: carInfo?.state,
        year: carInfo?.year,
        brand: carInfo?.brand,
        colour: carInfo?.colour,
        vinNumber: carInfo?.vinNumber,
        series: carInfo?.series,
        engine: carInfo?.engine,
        engineCode: carInfo?.engineCode,
        name: carInfo?.name,
        bodyStyle: carInfo?.bodyStyle,
        image: carInfo?.image,
        identificationSighted: carInfo?.identificationSighted,
        registered: carInfo?.registered,
        platesReturned: carInfo?.platesReturned,
        carInfo: carInfo?.carInfo,
        car_status:carInfo?.status,
        job_status: jobInfo?.status,
        jobID: jobInfo?.id,
      }, orderInfo);
    if (result) {
      return this.ok(result);
    } else {
      return this.fail();
    }
    } catch(e){
      return this.fail(e);
    }
  }
}
interface JobInfo {
  orderID: number;
  carID: number;
  departmentId: number;
  status: number;
}

enum SEARCH_CAR_API {
  S1 = 0,
  V1,
  V2,
  V3,
}
