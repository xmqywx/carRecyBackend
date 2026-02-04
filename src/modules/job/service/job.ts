import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { JobEntity } from '../entity/info';
import { JobStatusLogEntity } from '../entity/statusLog';
import { OrderInfoEntity } from '../../order/entity/info';
import { CarEntity } from '../../car/entity/base';
import { CustomerProfileEntity } from '../../customer/entity/profile';
import { SecondaryPersonEntity } from '../../secondaryPerson/entity/profile';

export interface StatusLogParams {
  jobId: number;
  orderId?: number;
  fromStatus?: number;
  toStatus: number;
  action: string;
  operatorId?: number;
  operatorName?: string;
  operatorType?: string;
  driverId?: number;
  driverName?: string;
  description?: string;
  cancellationReason?: number;
  rescheduledDate?: string;
}

@Provide()
export class JobService extends BaseService {
  @InjectEntityModel(JobEntity)
  jobEntity: Repository<JobEntity>;

  @InjectEntityModel(JobStatusLogEntity)
  jobStatusLogEntity: Repository<JobStatusLogEntity>;

  @InjectEntityModel(OrderInfoEntity)
  orderInfoEntity: Repository<OrderInfoEntity>;

  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;

  @InjectEntityModel(CustomerProfileEntity)
  customerProfileEntity: Repository<CustomerProfileEntity>;

  @InjectEntityModel(SecondaryPersonEntity)
  secondaryPersonEntity: Repository<SecondaryPersonEntity>;

  async add(params) {
    return this.jobEntity.save(params);
  }

  async get_job_all({ jobID, orderID }: { jobID: number; orderID: number }) {
    try {
      const promise = [];
      let jobDetail,
        orderDetail,
        customerDetail,
        carDetail,
        secondaryPersonDetail,
        otherJobs;
      promise.push(
        this.jobEntity.findOne({ id: jobID }).then(async res => {
          jobDetail = res;
          if (res.driverID != null) {
            otherJobs = await this.jobEntity
              .find({
                driverID: res.driverID,
                status: 1,
              })
              .then(res => res.filter(v => v.id !== jobID));
          }
        })
      );
      promise.push(
        this.orderInfoEntity.findOne({ id: orderID }).then(async orderRes => {
          if (!orderRes) return;
          orderDetail = orderRes;
          const promise2 = [];
          if (orderRes.carID) {
            promise2.push(
              this.carEntity.findOne({ id: orderRes.carID }).then(carRes => {
                carDetail = carRes;
              })
            );
          }
          if (orderRes.customerID) {
            promise2.push(
              this.customerProfileEntity
                .findOne({ id: Number(orderRes.customerID) })
                .then(customerRes => {
                  customerDetail = customerRes;
                })
            );
          }
          if (orderRes.secondaryID) {
            promise2.push(
              this.secondaryPersonEntity
                .findOne({ id: Number(orderRes.secondaryID) })
                .then(secondaryPersonRes => {
                  secondaryPersonDetail = secondaryPersonRes;
                })
            );
          }
          await Promise.all(promise2);
        })
      );
      await Promise.all(promise);
      return {
        jobDetail,
        orderDetail,
        customerDetail,
        carDetail,
        secondaryPersonDetail,
        otherJobs,
      };
    } catch (e) {
      return {
        error: e,
      };
    }
  }

  async open_get_job_info_all({ orderID }: { orderID: number }) {
    try {
      const promise = [];
      let jobDetail,
        orderDetail,
        customerDetail,
        carDetail,
        secondaryPersonDetail,
        otherJobs;
      promise.push(
        this.jobEntity.findOne({ orderID: orderID }).then(async res => {
          jobDetail = res;
        })
      );
      promise.push(
        this.orderInfoEntity.findOne({ id: orderID }).then(async orderRes => {
          if (!orderRes) return;
          orderDetail = orderRes;
          const promise2 = [];
          if (orderRes.carID) {
            promise2.push(
              this.carEntity.findOne({ id: orderRes.carID }).then(carRes => {
                carDetail = carRes;
              })
            );
          }
          if (orderRes.customerID) {
            promise2.push(
              this.customerProfileEntity
                .findOne({ id: Number(orderRes.customerID) })
                .then(customerRes => {
                  customerDetail = customerRes;
                })
            );
          }
          if (orderRes.secondaryID) {
            promise2.push(
              this.secondaryPersonEntity
                .findOne({ id: Number(orderRes.secondaryID) })
                .then(secondaryPersonRes => {
                  secondaryPersonDetail = secondaryPersonRes;
                })
            );
          }
          await Promise.all(promise2);
        })
      );
      await Promise.all(promise);
      return {
        jobDetail,
        orderDetail,
        customerDetail,
        carDetail,
        secondaryPersonDetail,
        otherJobs,
      };
    } catch (e) {
      return {
        error: e,
      };
    }
  }

  async update_job_order({
    jobDetail,
    orderDetail,
    customerDetail,
    carDetail,
    secondaryPersonDetail,
  }: {
    jobDetail?: any;
    orderDetail?: any;
    customerDetail?: any;
    carDetail?: any;
    secondaryPersonDetail?: any;
  }) {
    const promise = [];
    if (secondaryPersonDetail) {
      if (secondaryPersonDetail?.id) {
        promise.push(
          this.secondaryPersonEntity.update(
            { id: secondaryPersonDetail?.id },
            secondaryPersonDetail
          )
        );
      } else {
        if (secondaryPersonDetail.clear) {
          promise.push(
            this.secondaryPersonEntity
              .save(secondaryPersonDetail)
              .then(
                async res =>
                  await this.orderInfoEntity.update(
                    { id: orderDetail.id },
                    { secondaryID: null }
                  )
              )
          );
        } else {
          promise.push(
            this.secondaryPersonEntity
              .save(secondaryPersonDetail)
              .then(
                async res =>
                  await this.orderInfoEntity.update(
                    { id: orderDetail.id },
                    { secondaryID: res.id }
                  )
              )
          );
        }
      }
    }
    if (jobDetail?.id) {
      promise.push(this.jobEntity.update({ id: jobDetail.id }, jobDetail));
    }
    if (orderDetail?.id) {
      promise.push(
        this.orderInfoEntity.update({ id: orderDetail.id }, orderDetail)
      );
    }
    if (customerDetail?.id) {
      promise.push(
        this.customerProfileEntity.update(
          { id: customerDetail.id },
          customerDetail
        )
      );
    }
    if (carDetail?.id) {
      promise.push(this.carEntity.update({ id: carDetail.id }, carDetail));
    }

    return await Promise.all(promise);
  }

  /**
   * Log a status change for a job
   */
  async logStatusChange(params: StatusLogParams) {
    return await this.jobStatusLogEntity.save(params);
  }

  /**
   * Get status history for a job
   */
  async getJobHistory(jobId: number) {
    return await this.jobStatusLogEntity.find({
      where: { jobId },
      order: { createTime: 'DESC' },
    });
  }

  /**
   * Get status history for an order
   */
  async getOrderHistory(orderId: number) {
    return await this.jobStatusLogEntity.find({
      where: { orderId },
      order: { createTime: 'DESC' },
    });
  }

  /**
   * Determine the action type based on status change
   */
  determineAction(
    fromStatus: number | null | undefined,
    toStatus: number,
    jobInfo?: { driverID?: number }
  ): string {
    if (fromStatus === null || fromStatus === undefined) return 'created';
    if (toStatus === -1) return 'returned';
    if (fromStatus === -1) return 'reactivated';
    if (toStatus === 6) return 'cancelled';
    if (toStatus === 4) return 'completed';
    if (toStatus === 2) return 'started';
    if (fromStatus === 0 && toStatus === 1) return 'assigned';
    if (fromStatus === 1 && toStatus === 0) return 'unassigned';
    if (fromStatus === 1 && toStatus === 1 && jobInfo?.driverID) return 'reassigned';
    return 'updated';
  }

  /**
   * Get job list for schedule with latest cancellation info
   */
  async getJobListForSchedule(query: {
    status?: number;
    departmentId?: number;
  }) {
    // Build query
    const qb = this.jobEntity
      .createQueryBuilder('a')
      .leftJoin(OrderInfoEntity, 'b', 'a.orderID = b.id')
      .leftJoin(CarEntity, 'c', 'b.carID = c.id')
      .leftJoin(CustomerProfileEntity, 'e', 'b.customerID = e.id')
      .select([
        'a.*',
        'b.expectedDate as expectedDate',
        'b.pickupAddress as pickupAddress',
        'b.pickupAddressState as pickupAddressState',
        'b.quoteNumber as quoteNumber',
        'b.floating as floating',
        'c.name as name',
        'c.model as model',
        'c.year as year',
        'c.brand as brand',
        'c.colour as colour',
        'e.phoneNumber as phoneNumber',
        'e.firstName as firstName',
      ])
      .where('a.status != :archivedStatus', { archivedStatus: 5 })
      .andWhere('a.status != :deletedStatus', { deletedStatus: -1 });

    if (query.status !== undefined) {
      qb.andWhere('a.status = :status', { status: query.status });
    }
    if (query.departmentId) {
      qb.andWhere('a.departmentId = :departmentId', {
        departmentId: query.departmentId,
      });
    }

    const jobs = await qb.orderBy('a.updateTime', 'DESC').getRawMany();

    // Get latest driver_cancelled log for each job
    const jobIds = jobs.map(j => j.id);
    if (jobIds.length === 0) return jobs;

    const cancelLogs = await this.jobStatusLogEntity
      .createQueryBuilder('log')
      .where('log.jobId IN (:...jobIds)', { jobIds })
      .andWhere('log.action = :action', { action: 'driver_cancelled' })
      .orderBy('log.createTime', 'DESC')
      .getMany();

    // Create a map of jobId -> latest cancel log
    const cancelLogMap = new Map<number, JobStatusLogEntity>();
    for (const log of cancelLogs) {
      if (!cancelLogMap.has(log.jobId)) {
        cancelLogMap.set(log.jobId, log);
      }
    }

    // Attach cancel info to jobs
    return jobs.map(job => {
      const cancelLog = cancelLogMap.get(job.id);
      if (cancelLog) {
        return {
          ...job,
          lastCancelledByDriver: cancelLog.driverName,
          lastCancelledAt: cancelLog.createTime,
          lastCancellationReason: cancelLog.cancellationReason,
          lastCancellationNote: cancelLog.description,
        };
      }
      return job;
    });
  }
}
