import { Body, Post, Provide, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { Brackets, Repository } from 'typeorm';
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
import { parseExpectedDateRange } from '../../utils/expectedDateRange';
import { buildBookingCountQueryParts } from '../../utils/bookingCountQuery';

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
      'b.phoneNumber',
      'c.name',
      'model',
      'year',
      'brand',
      'c.registrationNumber',
      'c.vinNumber',
      'a.quoteNumber',
    ],
    select: [
      'a.*',
      // JobEntity is already joined as alias `e` (used for job_status etc),
      // so `e.isInspection` is cheap and cool-admin's select() quoter accepts
      // plain alias.column strings (vs. parenthesised subqueries which it mis-quotes).
      'e.isInspection as isInspection',
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
        expectedDateStart,
        expectedDateEnd,
        isPaid,
        notSchedule,
        searchRegistrationNumber,
      } = ctx.request.body;
      const expectedRange = parseExpectedDateRange(
        expectedDateStart ?? startDate,
        expectedDateEnd ?? endDate
      );
      return [
        isPaid
          ? [
              'a.actualPaymentPrice > :actualPaymentPrice and e.status = 4',
              { actualPaymentPrice: 0 },
            ]
          : [],
        expectedRange.expectedDateStart != null
          ? [
              'CAST(a.expectedDate AS UNSIGNED) >= :expectedDateStart',
              { expectedDateStart: expectedRange.expectedDateStart },
            ]
          : [],
        expectedRange.expectedDateEnd != null
          ? [
              'CAST(a.expectedDate AS UNSIGNED) <= :expectedDateEnd',
              { expectedDateEnd: expectedRange.expectedDateEnd },
            ]
          : [],
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
      // JobEntity is already joined as alias `e` (used for job_status etc),
      // so `e.isInspection` is cheap and cool-admin's select() quoter accepts
      // plain alias.column strings (vs. parenthesised subqueries which it mis-quotes).
      'e.isInspection as isInspection',
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
      const { startDate, endDate, expectedDateStart, expectedDateEnd, isPaid, notSchedule, keywordCustomer, hasCallback } =
        ctx.request.body;
      const expectedRange = parseExpectedDateRange(
        expectedDateStart ?? startDate,
        expectedDateEnd ?? endDate
      );
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
        // Booking page date filter = booking createTime (when the order was
        // entered into the system). Job/dispatch dates live on Schedule page.
        expectedRange.expectedDateStart != null
          ? [
              'a.createTime >= :bookingDateStart',
              { bookingDateStart: new Date(expectedRange.expectedDateStart) },
            ]
          : [],
        expectedRange.expectedDateEnd != null
          ? [
              'a.createTime <= :bookingDateEnd',
              { bookingDateEnd: new Date(expectedRange.expectedDateEnd) },
            ]
          : [],
        isNotScheduleSearch,
        keywordCustomer
          ? [
              'b.firstName LIKE :keywordCustomer',
              { keywordCustomer: `%${keywordCustomer}%` },
            ]
          : [],
        // Callback tab — only orders with a scheduled callback time.
        // Uses idx_order_callback_time for ordering.
        hasCallback
          ? ['a.callbackTime IS NOT NULL', {}]
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
    @Body('expectedDateStart') expectedDateStart: string | number,
    @Body('expectedDateEnd') expectedDateEnd: string | number,
    @Body('keyWord') keyWord: string,
    @Body('jobComplete') jobComplete = false,
    @Body('hasCallback') hasCallback = false
  ) {
    const expectedRange = parseExpectedDateRange(
      expectedDateStart ?? startDate,
      expectedDateEnd ?? endDate
    );
    const queryParts = buildBookingCountQueryParts({
      departmentId,
      status,
      expectedDateStart: expectedRange.expectedDateStart,
      expectedDateEnd: expectedRange.expectedDateEnd,
      keyWord,
      jobComplete,
      hasCallback,
    });

    const countQuery = this.orderInfoEntity
      .createQueryBuilder('a')
      .leftJoin(CustomerProfileEntity, 'b', 'a.customerID = b.id')
      .leftJoin(CarEntity, 'c', 'a.carID = c.id')
      .leftJoin(JobEntity, 'e', 'a.id = e.orderID')
      .select('COUNT(DISTINCT a.id)', 'count');

    for (const clause of queryParts.clauses) {
      countQuery.andWhere(clause, queryParts.params);
    }

    if (queryParts.keywordFields.length > 0) {
      countQuery.andWhere(
        new Brackets(qb => {
          queryParts.keywordFields.forEach((field, index) => {
            if (index === 0) {
              qb.where(`${field} LIKE :bookingKeyword`, queryParts.params);
            } else {
              qb.orWhere(`${field} LIKE :bookingKeyword`, queryParts.params);
            }
          });
        })
      );
    }

    const countResult = await countQuery.getRawOne();
    const count = Number(countResult?.count ?? 0);
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
   * 获取 Job 统计数。where 子句与 job.page() 保持一致，这样 Schedule List 上方
   * 的 tab 数字和下方表格实际行数对得上：
   *   - 始终排除 status=5 (archived) / status=-1 (deleted)
   *   - status=0 (To Assign) 的日期筛选用客户期望日 b.expectedDate
   *   - 其他 status 的日期筛选用排期时间 a.schedulerStart
   *   - 无日期参数时保持旧前端行为（不做日期过滤）
   */
  @Post('/getCountJob')
  async getCountJob(
    @Body('status') status: number,
    @Body('departmentId') departmentId: number,
    @Body('startDate') startDate: number | string,
    @Body('endDate') endDate: number | string
  ) {
    const qb = this.jobEntity
      .createQueryBuilder('a')
      .where('a.status != :archived', { archived: 5 })
      .andWhere('a.status != :deleted', { deleted: -1 });

    if (status !== undefined && status !== null) {
      qb.andWhere('a.status = :status', { status });
    }
    if (departmentId) {
      qb.andWhere('a.departmentId = :departmentId', { departmentId });
    }

    if (startDate && endDate) {
      if (status === 0) {
        qb.leftJoin(OrderInfoEntity, 'b', 'a.orderID = b.id')
          .andWhere('b.expectedDate >= :startDate', { startDate })
          .andWhere('b.expectedDate <= :endDate', { endDate });
      } else {
        qb.andWhere('a.schedulerStart >= :startDate', { startDate })
          .andWhere('a.schedulerStart <= :endDate', { endDate });
      }
    }

    const count = await qb.getCount();
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
    @Body('api') api: number,
    // Operator-driven force-refresh: skip the cache entirely (including
    // not-found sentinel rows whose 7-day TTL would otherwise hide a vehicle
    // that has since been registered or that the third-party temporarily
    // failed on).
    @Body('bypassCache') bypassCache = false
  ) {
    if (!registrationNumber && !vin) {
      return this.fail('Registration number or VIN is required');
    }

    // Cache lookup with mismatch detection.
    // - Both rego + vin provided → first try exact (both match same row).
    //   Otherwise, only flag mismatch when a cached row has BOTH fields
    //   populated AND a populated field actually disagrees with the request.
    //   A row that's missing one field (e.g. cached when user originally
    //   searched by rego only) is incomplete, not contradictory — fall through
    //   to the third-party API to refill it.
    // - Only one provided → use it as the cache key.
    // bypassCache → don't return any cached payload, but still resolve the
    // existing row's id so the third-party fetch overwrites it in place
    // instead of inserting a duplicate (which would leave the stale row
    // around to bite the next non-bypass query).
    let carRegList: any[] = [];
    let bypassReuseId: number | undefined;
    if (bypassCache) {
      const matches = await this.carRegEntity.find({
        where: registrationNumber && vin
          ? [{ registrationNumber, vin }, { registrationNumber }, { vin }]
          : registrationNumber
            ? { registrationNumber }
            : { vin },
      } as any);
      if (matches.length) bypassReuseId = matches[0].id;
    } else if (registrationNumber && vin) {
      const exact = await this.carRegEntity.find({
        where: { registrationNumber, vin },
      } as any);
      if (exact.length) {
        carRegList = exact;
      } else {
        const eitherMatch = await this.carRegEntity.find({
          where: [{ registrationNumber }, { vin }],
        } as any);
        const conflict = eitherMatch.find((r: any) => {
          // cached row's rego is set AND disagrees with request → real mismatch
          if (r.registrationNumber && r.registrationNumber !== registrationNumber) return true;
          // OR cached row's vin is set AND disagrees with request → real mismatch
          if (r.vin && r.vin !== vin) return true;
          return false;
        });
        if (conflict) {
          return this.fail(
            'Registration number and VIN do not match the same vehicle. Please verify both, or clear one before searching.'
          );
        }
        // Otherwise (rows are partial / compatible) → don't return cached
        // record (it's incomplete); let the third-party fetch run and refresh.
      }
    } else if (registrationNumber) {
      carRegList = await this.carRegEntity.find({
        where: { registrationNumber },
      } as any);
    } else if (vin) {
      carRegList = await this.carRegEntity.find({ where: { vin } } as any);
    }
    let carRegFind;
    if (carRegList.length) {
      carRegFind = carRegList[0].id ?? undefined;
    } else if (bypassReuseId != null) {
      // Force-refresh path: reuse the existing stale row's id so save()
      // updates it in place. carRegList stays empty so cached json/json_v2
      // is NOT returned to the caller.
      carRegFind = bypassReuseId;
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
        if (carRegList[0].json?._notFound) {
          const cachedAt = new Date(carRegList[0].json.cachedAt).getTime();
          if ((Date.now() - cachedAt) / 86400000 < 7) {
            return this.fail('Vehicle not found');
          }
        } else {
          return this.ok(carRegList[0].json);
        }
      }

      try {
        const savePayload: any = { registrationNumber, state, vin };
        // Use carRegFind (set above from either carRegList or bypassReuseId)
        // so that bypassCache=true UPDATES the stale row in place instead of
        // INSERTing a new one. Otherwise the old not-found cache would
        // linger and re-block any non-bypass query.
        if (carRegFind != null) {
          savePayload.id = carRegFind;
        }
        const res = await this.orderService.fetchDataWithV1(
          registrationNumber,
          state,
          vin
        );
        if(!res || !res.result) {
          return this.fail('Please try again later.');
        }
        if(res.result.responseCode !== 'SUCCESS') {
          savePayload.json = { _notFound: true, responseCode: res.result.responseCode, description: res.result.description, cachedAt: new Date().toISOString() };
          try { await this.carRegEntity.save(savePayload); } catch (e) { console.error('[getCarInfo V1] cache save failed:', e?.message); }
          return this.fail(res.result.description);
        }
        let jsonData1 = res.result.vehicles[0] ?? null;

        if (!jsonData1) {
          savePayload.json = { _notFound: true, reason: 'no vehicle data', cachedAt: new Date().toISOString() };
          try { await this.carRegEntity.save(savePayload); } catch {}
          return this.fail('This content cannot be found or does not exist.');
        }
        const jsonData = { ...jsonData1 };
        savePayload.json = jsonData;
        try { await this.carRegEntity.save(savePayload); } catch (e) { console.error('[getCarInfo V1] cache save failed:', e?.message); }
        return this.ok(jsonData);
      } catch (e) {
        return this.fail(
          'Unable to obtain correct vehicle information,please try again later.'
        );
      }
    } else if (api === SEARCH_CAR_API.V2) {
      if (carRegList.length && carRegList[0].json_v2) {
        // Cache HIT — check if it's a cached "not found" sentinel
        if (carRegList[0].json_v2?._notFound) {
          // TTL: "not found" cache expires after 7 days — vehicle might get registered later
          const cachedAt = new Date(carRegList[0].json_v2.cachedAt).getTime();
          const daysSince = (Date.now() - cachedAt) / 86400000;
          if (daysSince < 7) {
            return this.fail('Vehicle not found');
          }
          // Expired → fall through to re-check third-party
        } else {
          return this.ok(carRegList[0].json_v2);
        }
      }
      try {
        // Build save payload WITHOUT id:undefined (which can cause TypeORM
        // to do a broken UPDATE instead of INSERT on some versions)
        const savePayload: any = { registrationNumber, state, vin };
        // Use carRegFind (set above from either carRegList or bypassReuseId)
        // so that bypassCache=true UPDATES the stale row in place instead of
        // INSERTing a new one. Otherwise the old not-found cache would
        // linger and re-block any non-bypass query.
        if (carRegFind != null) {
          savePayload.id = carRegFind;
        }

        const res = await this.orderService.fetchDataWithV2(
          registrationNumber,
          state,
          vin
        );
        if(!res || !res.result) {
          return this.fail('Please try again later.');
        }
        if(res.result.responseCode !== 'SUCCESS') {
          // CACHE the "not found" result so we don't keep hitting the
          // third-party API for the same invalid VIN/rego.
          // This was the root cause of 421 calls × $0.06 each.
          savePayload.json_v2 = { _notFound: true, responseCode: res.result.responseCode, description: res.result.description, cachedAt: new Date().toISOString() };
          try {
            await this.carRegEntity.save(savePayload);
          } catch (saveErr) {
            console.error('[getCarInfo V2] Failed to cache not-found result:', saveErr?.message);
          }
          return this.fail(res.result.description);
        }

        let jsonData2 = res.result.vehicle ?? null;
        if (!jsonData2) {
          // Also cache this "no vehicle data" case
          savePayload.json_v2 = { _notFound: true, reason: 'no vehicle data in response', cachedAt: new Date().toISOString() };
          try { await this.carRegEntity.save(savePayload); } catch {}
          return this.fail('This content cannot be found or does not exist.');
        }
        // Mismatch guard: third-party (infoagent.com.au) decides on its own
        // how to resolve, sometimes returning a similar but DIFFERENT vehicle
        // than what was typed (customer report 2026-04-23: typed CRV68T,
        // got back CVR68T). Reject any response whose plate or VIN doesn't
        // match what the user actually typed.
        const norm = (s: any) => String(s || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
        const apiPlate = norm(jsonData2?.identification?.plate);
        const apiVin = norm(jsonData2?.identification?.vin);
        const reqPlate = norm(registrationNumber);
        const reqVin = norm(vin);
        if (reqPlate && apiPlate && apiPlate !== reqPlate) {
          return this.fail(
            `The registry returned ${apiPlate}, not ${reqPlate}. Please double-check the rego (the third-party API may have auto-corrected to a similar plate).`
          );
        }
        if (reqVin && apiVin && apiVin !== reqVin) {
          return this.fail(
            `The registry returned VIN ${apiVin}, not the one you entered. Please double-check the VIN.`
          );
        }
        const jsonData = { ...jsonData2 };
        savePayload.json_v2 = jsonData;
        try {
          await this.carRegEntity.save(savePayload);
        } catch (saveErr) {
          // Log but don't fail the request — the data was fetched successfully
          console.error('[getCarInfo V2] Failed to cache result:', saveErr?.message);
        }
        return this.ok(jsonData);
      } catch (e) {
        return this.fail(
          'Unable to obtain correct vehicle information,please try again later.'
        );
      }
    } else if (api === SEARCH_CAR_API.V3) {
      if (carRegList.length && carRegList[0].json_v3) {
        if (carRegList[0].json_v3?._notFound) {
          const cachedAt = new Date(carRegList[0].json_v3.cachedAt).getTime();
          if ((Date.now() - cachedAt) / 86400000 < 7) {
            return this.fail('Vehicle not found');
          }
        } else {
          return this.ok(carRegList[0].json_v3);
        }
      }
      try {
        const savePayload: any = { registrationNumber, state, vin };
        // Use carRegFind (set above from either carRegList or bypassReuseId)
        // so that bypassCache=true UPDATES the stale row in place instead of
        // INSERTing a new one. Otherwise the old not-found cache would
        // linger and re-block any non-bypass query.
        if (carRegFind != null) {
          savePayload.id = carRegFind;
        }
        const res = await this.orderService.fetchDataWithV3(
          registrationNumber,
          state,
          vin
        );
        if(!res || !res.result) {
          return this.fail('Please try again later.');
        }
        if(res.result.responseCode !== 'SUCCESS') {
          savePayload.json_v3 = { _notFound: true, responseCode: res.result.responseCode, description: res.result.description, cachedAt: new Date().toISOString() };
          try { await this.carRegEntity.save(savePayload); } catch (e) { console.error('[getCarInfo V3] cache save failed:', e?.message); }
          return this.fail(res.result.description);
        }
        let jsonData2 = res?.result?.vehicle ?? null;
        if (!jsonData2) {
          savePayload.json_v3 = { _notFound: true, reason: 'no vehicle data', cachedAt: new Date().toISOString() };
          try { await this.carRegEntity.save(savePayload); } catch {}
          return this.fail('This content cannot be found or does not exist.');
        }
        // Same mismatch guard as V2 — applies whether one or both of rego/vin
        // were sent. Third-party may auto-correct to a similar plate.
        const normV3 = (s: any) => String(s || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
        const apiPlateV3 = normV3(jsonData2?.identification?.plate);
        const apiVinV3 = normV3(jsonData2?.identification?.vin);
        const reqPlateV3 = normV3(registrationNumber);
        const reqVinV3 = normV3(vin);
        if (reqPlateV3 && apiPlateV3 && apiPlateV3 !== reqPlateV3) {
          return this.fail(
            `The registry returned ${apiPlateV3}, not ${reqPlateV3}. Please double-check the rego.`
          );
        }
        if (reqVinV3 && apiVinV3 && apiVinV3 !== reqVinV3) {
          return this.fail(
            `The registry returned VIN ${apiVinV3}, not the one you entered. Please double-check the VIN.`
          );
        }
        const jsonData = { ...jsonData2 };
        savePayload.json_v3 = jsonData;
        try { await this.carRegEntity.save(savePayload); } catch (e) { console.error('[getCarInfo V3] cache save failed:', e?.message); }
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
    @Body('job_info') job_info: JobInfo,
    @Body('operatorInfo') operatorInfo: OperatorInfo
  ) {
    const res = await this.orderService.bookedUpdateStatus(
      orderId,
      order_status,
      job_status,
      job_info,
      operatorInfo
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
        // Previously missing — caused the Edit drawer to show blank
        // Engine Number / Cylinders / Power / Fuel / Kilometers /
        // Transmission every time even when saved in DB.
        engineNumber: carInfo?.engineNumber,
        cylinders: carInfo?.cylinders,
        power: carInfo?.power,
        fuel: carInfo?.fuel,
        kilometers: carInfo?.kilometers,
        transmission: carInfo?.transmission,
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
        // Inspection flag lives on the Job; surface it here so the BookingForm
        // edit-mode chip can self-initialise from populateForm.
        isInspection: jobInfo?.isInspection ?? 0,
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
  driverID?: number;
  driverName?: string;
  schedulerStart?: string;
  schedulerEnd?: string;
}

interface OperatorInfo {
  operatorId?: number;
  operatorName?: string;
  operatorType?: string;
}

enum SEARCH_CAR_API {
  S1 = 0,
  V1,
  V2,
  V3,
}
