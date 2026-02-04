import { Body, Post, Provide, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/orm';
import { JobEntity } from '../../entity/info';
import { CarEntity } from '../../../car/entity/base';
import { BaseSysUserEntity } from '../../../base/entity/sys/user';
import { OrderInfoEntity } from '../../../order/entity/info';
import { CustomerProfileEntity } from '../../../customer/entity/profile';
import { JobService } from '../../service/job';

/**
 * 司机任务
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: JobEntity,

  listQueryOp: {
    keyWordLikeFields: [
      'c.name',
      'c.model',
      'c.year',
      'b.pickupAddress',
      'b.pickupAddressState',
      'd.username',
      'b.quoteNumber',
    ],
    select: [
      'a.*',
      'b.expectedDate',
      'b.pickupAddress',
      'b.pickupAddressState',
      'b.quoteNumber',
      'c.name',
      'c.model',
      'c.year',
      'c.brand',
      'c.colour',
      'c.vinNumber',
      'c.series',
      'c.engine',
      'c.image',
      'e.phoneNumber',
      'e.firstName',
      'b.floating',
    ],
    // 多表关联，请求筛选字段与表字段不一致的情况
    fieldEq: [
      { column: 'a.createTime', requestParam: 'createTime' },
      { column: 'a.status', requestParam: 'status' },
      { column: 'a.driverID', requestParam: 'driverID' },
      { column: 'a.departmentId', requestParam: 'departmentId' },
      { column: 'a.id', requestParam: 'id' },
      { column: 'a.orderID', requestParam: 'orderID' },
      { column: 'b.floating', requestParam: 'floating' },
    ],
    join: [
      {
        entity: OrderInfoEntity,
        alias: 'b',
        condition: 'a.orderID = b.id',
        type: 'leftJoin',
      },
      {
        entity: CarEntity,
        alias: 'c',
        condition: 'b.carID = c.id',
        type: 'leftJoin',
      },
      {
        entity: BaseSysUserEntity,
        alias: 'd',
        condition: 'a.driverID = d.id',
        type: 'leftJoin',
      },
      {
        entity: CustomerProfileEntity,
        alias: 'e',
        condition: 'b.customerID = e.id',
        type: 'leftJoin',
      },
    ],
    where: async ctx => {
      const { startDate, endDate, status, expectedDateStart, expectedDateEnd } =
        ctx.request.body;
      if (status === 0) {
        return [
          ['a.status != :archivedStatus', { archivedStatus: 5 }],
          ['a.status != :deletedStatus', { deletedStatus: -1 }],
          startDate
            ? ['a.updateTime >= :startDate', { startDate: new Date(startDate) }]
            : [],
          endDate
            ? ['a.updateTime <= :endDate', { endDate: new Date(endDate) }]
            : [],
          expectedDateStart
            ? ['b.expectedDate >= :expectedDateStart', { expectedDateStart }]
            : [],
          expectedDateEnd
            ? ['b.expectedDate <= :expectedDateEnd', { expectedDateEnd }]
            : [],
        ];
      } else {
        return [
          ['a.status != :archivedStatus', { archivedStatus: 5 }],
          ['a.status != :deletedStatus', { deletedStatus: -1 }],
          startDate
            ? ['a.schedulerStart >= :startDate', { startDate: startDate }]
            : [],
          endDate ? ['a.schedulerStart <= :endDate', { endDate: endDate }] : [],
          expectedDateStart
            ? ['b.expectedDate >= :expectedDateStart', { expectedDateStart }]
            : [],
          expectedDateEnd
            ? ['b.expectedDate <= :expectedDateEnd', { expectedDateEnd }]
            : [],
        ];
      }
    },
  },
  pageQueryOp: {
    keyWordLikeFields: [
      'c.name',
      'c.model',
      'c.year',
      'b.pickupAddress',
      'b.pickupAddressState',
      'd.username',
      'b.quoteNumber',
    ],
    select: [
      'a.*',
      'b.expectedDate',
      'b.pickupAddress',
      'b.pickupAddressState',
      'b.pickupAddressLat',
      'b.pickupAddressLng',
      'b.quoteNumber AS quoteNumber',
      'c.name',
      'c.model',
      'c.year',
      'c.brand',
      'c.colour',
      'c.vinNumber',
      'd.username',
      'b.floating',
    ],
    // 多表关联，请求筛选字段与表字段不一致的情况
    fieldEq: [
      { column: 'a.createTime', requestParam: 'createTime' },
      { column: 'a.status', requestParam: 'status' },
      { column: 'a.departmentId', requestParam: 'departmentId' },
      { column: 'a.driverID', requestParam: 'driverID' },
      { column: 'a.orderID', requestParam: 'orderID' },
      { column: 'b.floating', requestParam: 'floating' },
    ],
    join: [
      {
        entity: OrderInfoEntity,
        alias: 'b',
        condition: 'a.orderID = b.id',
        type: 'leftJoin',
      },
      {
        entity: CarEntity,
        alias: 'c',
        condition: 'b.carID = c.id',
        type: 'leftJoin',
      },
      {
        entity: BaseSysUserEntity,
        alias: 'd',
        condition: 'a.driverID = d.id',
        type: 'leftJoin',
      },
    ],
    where: async ctx => {
      const { startDate, endDate, status } = ctx.request.body;
      if (status === 0) {
        return [
          ['a.status != :archivedStatus', { archivedStatus: 5 }],
          ['a.status != :deletedStatus', { deletedStatus: -1 }],
          startDate
            ? ['a.updateTime >= :startDate', { startDate: new Date(startDate) }]
            : [],
          endDate
            ? ['a.updateTime <= :endDate', { endDate: new Date(endDate) }]
            : [],
        ];
      } else {
        return [
          ['a.status != :archivedStatus', { archivedStatus: 5 }],
          ['a.status != :deletedStatus', { deletedStatus: -1 }],
          startDate
            ? ['a.updateTime >= :startDate', { startDate: new Date(startDate) }]
            : [],
          endDate
            ? ['a.updateTime <= :endDate', { endDate: new Date(endDate) }]
            : [],
        ];
      }
    },
  },
  service: JobService,
})
export class VehicleProfileController extends BaseController {
  @InjectEntityModel(JobEntity)
  jobEntity: Repository<JobEntity>;
  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;

  @Inject()
  jobService: JobService;

  @Post('/updateJob')
  async updateJob(
    @Body('orderID') orderID: number,
    @Body('status') status: number,
    @Body('operatorId') operatorId?: number,
    @Body('operatorName') operatorName?: string,
    @Body('driverId') driverId?: number,
    @Body('driverName') driverName?: string
  ) {
    const job = await this.jobEntity.findOne({ where: { orderID } });
    const oldStatus = job?.status;

    await this.jobEntity.update(
      {
        orderID,
      },
      {
        status,
      }
    );

    // Log status change
    if (job) {
      const action = this.jobService.determineAction(oldStatus, status, { driverID: driverId });
      await this.jobService.logStatusChange({
        jobId: job.id,
        orderId: orderID,
        fromStatus: oldStatus,
        toStatus: status,
        action: action,
        operatorId: operatorId,
        operatorName: operatorName,
        operatorType: 'admin',
        driverId: driverId,
        driverName: driverName,
      });
    }
    return this.ok();
  }

  @Post('/get_job_all')
  async get_job_all(
    @Body('jobID') jobID: number,
    @Body('orderID') orderID: number
  ) {
    try {
      const searchData = await this.jobService.get_job_all({
        jobID,
        orderID,
      });
      return this.ok(searchData);
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/update_job_order')
  async update_job_order(
    @Body('jobDetail') jobDetail?: any,
    @Body('orderDetail') orderDetail?: any,
    @Body('customerDetail') customerDetail?: any,
    @Body('carDetail') carDetail?: any,
    @Body('secondaryPersonDetail') secondaryPersonDetail?: any
  ) {
    try {
      const searchData = await this.jobService.update_job_order({
        jobDetail,
        orderDetail,
        customerDetail,
        carDetail,
        secondaryPersonDetail,
      });
      return this.ok(searchData);
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Driver cancel job - resets job to initial booked state (To Assign)
   * Cancellation reasons:
   * 0: Customer not home
   * 1: Cannot access vehicle
   * 2: Vehicle already sold
   * 3: Wrong address
   * 4: Workshop closed
   * 5: Vehicle doesn't match description
   * 6: Dispute during pickup
   * 7: Suspicious job
   * 8: Reschedule to another date
   */
  @Post('/cancelJob')
  async cancelJob(
    @Body('jobId') jobId: number,
    @Body('orderId') orderId: number,
    @Body('cancellationReason') cancellationReason: number,
    @Body('description') description?: string,
    @Body('driverId') driverId?: number,
    @Body('driverName') driverName?: string
  ) {
    try {
      const job = await this.jobEntity.findOne({ where: { id: jobId } });
      if (!job) {
        return this.fail('Job not found');
      }

      const oldStatus = job.status;
      // Reset to initial booked state: status=0 (To Assign), clear driver and schedule
      const newStatus = 0;
      const action = 'driver_cancelled';

      job.status = newStatus;
      job.driverID = null;
      job.schedulerStart = null;
      job.schedulerEnd = null;
      job.preselectedDriverId = null;
      job.preselectedDriverName = null;
      job.preselectedTime = null;
      job.preselectedDuration = null;
      await this.jobEntity.save(job);

      // Log the cancellation
      await this.jobService.logStatusChange({
        jobId: jobId,
        orderId: orderId,
        fromStatus: oldStatus,
        toStatus: newStatus,
        action: action,
        operatorType: 'driver',
        driverId: driverId,
        driverName: driverName,
        description: description,
        cancellationReason: cancellationReason,
      });

      return this.ok({ success: true, newStatus, action });
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Driver complete job
   */
  @Post('/completeJob')
  async completeJob(
    @Body('jobId') jobId: number,
    @Body('orderId') orderId: number,
    @Body('driverId') driverId?: number,
    @Body('driverName') driverName?: string
  ) {
    try {
      const job = await this.jobEntity.findOne({ where: { id: jobId } });
      if (!job) {
        return this.fail('Job not found');
      }

      const oldStatus = job.status;
      const newStatus = 4; // Completed
      const action = 'completed';

      job.status = newStatus;
      await this.jobEntity.save(job);

      // Log the completion
      await this.jobService.logStatusChange({
        jobId: jobId,
        orderId: orderId,
        fromStatus: oldStatus,
        toStatus: newStatus,
        action: action,
        operatorType: 'driver',
        driverId: driverId,
        driverName: driverName,
      });

      // Get remaining uncompleted jobs for today for this driver
      // Use job.schedulerStart (not order.expectedDate) as the actual scheduled time
      let remainingJobs = [];
      if (driverId) {
        // schedulerStart is stored as timestamp (milliseconds)
        // Calculate today's start and end timestamps
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStart = today.getTime(); // Start of today (00:00:00)
        const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1; // End of today (23:59:59.999)

        remainingJobs = await this.jobEntity
          .createQueryBuilder('a')
          .leftJoin(OrderInfoEntity, 'b', 'a.orderID = b.id')
          .leftJoin(CarEntity, 'c', 'b.carID = c.id')
          .leftJoin(CustomerProfileEntity, 'e', 'b.customerID = e.id')
          .select([
            'a.id as id',
            'a.orderID as orderID',
            'a.status as status',
            'a.schedulerStart as schedulerStart',
            'b.pickupAddress as pickupAddress',
            'b.pickupAddressState as pickupAddressState',
            'b.quoteNumber as quoteNumber',
            'c.name as name',
            'c.model as model',
            'c.year as year',
            'c.brand as brand',
            'c.image as image',
            'e.phoneNumber as phoneNumber',
            'e.firstName as firstName',
          ])
          .where('a.driverID = :driverId', { driverId })
          .andWhere('a.id != :jobId', { jobId })
          .andWhere('a.status NOT IN (:...excludeStatus)', { excludeStatus: [4, 5, -1] }) // Not completed, archived, deleted
          .andWhere('a.schedulerStart >= :todayStart', { todayStart })
          .andWhere('a.schedulerStart <= :todayEnd', { todayEnd })
          .orderBy('a.schedulerStart', 'ASC')
          .getRawMany();
      }

      // Debug: query all jobs for this driver (ignore date filter)
      const allDriverJobs = await this.jobEntity
        .createQueryBuilder('a')
        .select([
          'a.id as id',
          'a.status as status',
          'a.schedulerStart as schedulerStart',
        ])
        .where('a.driverID = :driverId', { driverId })
        .andWhere('a.id != :jobId', { jobId })
        .getRawMany();

      const todayDebug = new Date();
      todayDebug.setHours(0, 0, 0, 0);
      const todayStartDebug = todayDebug.getTime();
      const todayEndDebug = todayStartDebug + 24 * 60 * 60 * 1000 - 1;

      console.log('======== completeJob debug ========');
      console.log('driverId:', driverId);
      console.log('jobId:', jobId);
      console.log('todayStart:', todayStartDebug, '(' + new Date(todayStartDebug).toISOString() + ')');
      console.log('todayEnd:', todayEndDebug, '(' + new Date(todayEndDebug).toISOString() + ')');
      console.log('All driver jobs (excluding current):', JSON.stringify(allDriverJobs, null, 2));
      console.log('remainingJobs count:', remainingJobs.length);
      console.log('remainingJobs:', JSON.stringify(remainingJobs, null, 2));
      console.log('====================================');

      const result = {
        success: true,
        newStatus,
        action,
        remainingJobs: remainingJobs
      };
      return this.ok(result);
    } catch (e) {
      return this.fail(e);
    }
  }
}
