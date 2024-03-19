import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { JobEntity } from '../entity/info';
import { OrderInfoEntity } from '../../order/entity/info';
import { CarEntity } from '../../car/entity/base';
import { CustomerProfileEntity } from '../../customer/entity/profile';
import { SecondaryPersonEntity } from '../../secondaryPerson/entity/profile';
@Provide()
export class JobService extends BaseService {
  @InjectEntityModel(JobEntity)
  jobEntity: Repository<JobEntity>;

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
}
