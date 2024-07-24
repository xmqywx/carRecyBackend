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
      status,
      departmentId,
    };
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

  // @Post('/getCarInfo')
  // async getCarInfo(
  //   @Body('registrationNumber') registrationNumber: string,
  //   @Body('state') state: string
  // ) {
  //   const carRegList = await this.carRegEntity.find({
  //     registrationNumber,
  //     state,
  //   });
  //   if (carRegList.length && carRegList[0].xml) {
  //     const carString = xml2json.toJson(carRegList[0].xml);
  //     let json = JSON.parse(carString);
  //     const vehicleJson = json.Vehicle.vehicleJson;
  //     return this.ok(JSON.parse(vehicleJson));
  //   }
  //   try {
  //     let carRegFind;
  //     if (carRegList.length) {
  //       carRegFind = carRegList[0].id ?? undefined;
  //     }
  //     const data = await axios
  //       .get('http://www.carregistrationapi.com/api/reg.asmx/CheckAustralia', {
  //         params: {
  //           RegistrationNumber: registrationNumber,
  //           State: state,
  //           username: 'smtm2099',
  //         },
  //       })
  //       .then(async res => {
  //         await this.carRegEntity.save({
  //           id: carRegFind,
  //           registrationNumber,
  //           state,
  //           xml: res.data,
  //         });
  //         return xml2json.toJson(res.data);
  //       });
  //     let json = JSON.parse(data);
  //     const vehicleJson = json.Vehicle.vehicleJson;
  //     return this.ok(JSON.parse(vehicleJson));
  //   } catch (e) {
  //     return this.fail('Unable to obtain correct vehicle information');
  //   }
  // }

  @Post('/getCarInfo')
  async getCarInfo(
    @Body('registrationNumber') registrationNumber: string,
    @Body('state') state: string,
    @Body('api') api: number
  ) {
    const carRegList = await this.carRegEntity.find({
      registrationNumber,
      state,
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
        if(!data) {
          return this.fail('Unable to obtain content');
        }
        await this.carRegEntity.save({
          id: carRegFind,
          registrationNumber,
          state,
          xml: data,
        });
        let handleData = xml2json.toJson(data);
        let json = JSON.parse(handleData);
        const vehicleJson = json.Vehicle.vehicleJson;
        return this.ok(JSON.parse(vehicleJson));
      } catch (e) {
        console.log(e.message);
        if(e.message === 'timeout of 8000ms exceeded') {
          return this.fail('This content cannot be found or does not exist.');
        }

        return this.fail('Unable to obtain correct vehicle information,please try again later.');
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
        let jsonData1;
        const promise = [];

        promise.push(
          this.orderService
            .fetchDataWithV1(registrationNumber, state)
            .then(async res => {
              console.log();
              jsonData1 = res?.result?.vehicles[0] ?? null;
            })
        );
        await Promise.all(promise);

        if (!jsonData1) {
          return this.fail('This content cannot be found or does not exist.');
        }
        const jsonData = { ...jsonData1 };
        await this.carRegEntity.save({
          id: carRegFind,
          registrationNumber,
          state,
          json: jsonData,
        });
        return this.ok(jsonData);
      } catch (e) {
        return this.fail('Unable to obtain correct vehicle information,please try again later.');
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
        let jsonData2;
        const promise = [];
        promise.push(
          this.orderService
            .fetchDataWithV2(registrationNumber, state)
            .then(async res => {
              jsonData2 = res?.result?.vehicle ?? null;
            })
        );
        await Promise.all(promise);
        if (!jsonData2) {
          return this.fail('This content cannot be found or does not exist.');
        }
        const jsonData = { ...jsonData2 };
        await this.carRegEntity.save({
          id: carRegFind,
          registrationNumber,
          state,
          json_v2: jsonData,
        });
        return this.ok(jsonData);
      } catch (e) {
        return this.fail('Unable to obtain correct vehicle information,please try again later.');
      }
    } else if (api === SEARCH_CAR_API.V3) {
      if (carRegList.length && carRegList[0].json_v3) {
        return this.ok(carRegList[0].json_v3);
      }
      try {
        let carRegFind;
        if (carRegList.length) {
          carRegFind = carRegList[0].id ?? undefined;
        }
        let jsonData2;
        const promise = [];
        promise.push(
          this.orderService
            .fetchDataWithV3(registrationNumber, state)
            .then(async res => {
              jsonData2 = res?.result?.vehicle ?? null;
            })
        );
        await Promise.all(promise);
        if (!jsonData2) {
          return this.fail('This content cannot be found or does not exist.');
        }
        const jsonData = { ...jsonData2 };
        await this.carRegEntity.save({
          id: carRegFind,
          registrationNumber,
          state,
          json_v3: jsonData,
        });
        return this.ok(jsonData);
      } catch (e) {
        return this.fail('Unable to obtain correct vehicle information,please try again later.');
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
