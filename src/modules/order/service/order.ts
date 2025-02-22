import { Provide, Inject } from '@midwayjs/decorator';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository, Between } from 'typeorm';
import { OrderInfoEntity } from '../entity/info';
import { OrderActionEntity } from '../entity/action';
import { JobEntity } from '../../job/entity/info';
import { CarWreckedEntity } from '../../car/entity/carWrecked';
import { CarEntity } from '../../car/entity/base';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import { CarRegEntity } from '../../carReg/entity/info';
import { AccessToken } from './accessToken';

@Provide()
export class OrderService extends BaseService {
  @InjectEntityModel(OrderInfoEntity)
  orderInfoEntity: Repository<OrderInfoEntity>;
  @InjectEntityModel(OrderActionEntity)
  orderActionEntity: Repository<OrderActionEntity>;
  @InjectEntityModel(JobEntity)
  jobEntity: Repository<JobEntity>;
  @InjectEntityModel(CarWreckedEntity)
  carWreckedEntity: Repository<CarWreckedEntity>;
  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;
  @InjectEntityModel(CarRegEntity)
  carRegEntity: Repository<CarRegEntity>;
  @Inject()
  accessTokenService: AccessToken;

  async getCountMonth(departmentId) {
    const year = new Date().getFullYear();
    const sql = `
        SELECT DATE_FORMAT(createTime,'%m') as month, count(*) as count FROM \`order\` WHERE
        DATE_FORMAT(createTime,'%Y') = '${year}'
          and departmentId = ${departmentId}
          and ( status = 1 or status = 3)
          GROUP BY DATE_FORMAT(createTime,'%m');`;
    const sql2 = `
        SELECT DATE_FORMAT(createTime,'%m') as month, count(*) as count FROM \`order\` WHERE
        DATE_FORMAT(createTime,'%Y') = '${year}'
          and departmentId = ${departmentId}
          GROUP BY DATE_FORMAT(createTime,'%m');
    `;
    const list1 = await this.nativeQuery(sql);
    const list2 = await this.nativeQuery(sql2);
    return {
      order: list1,
      lead: list2,
    };
  }
  async getInvoice(id) {
    const getInvoiceSql = `
    SELECT * FROM \`order\` WHERE id = '${id}';
    `;
    const getInvoiceSqlRes = await this.nativeQuery(getInvoiceSql);
    return getInvoiceSqlRes[0].invoice;
  }
  async saveInvoice(id, path) {
    const updateSql = `
      UPDATE \`order\` SET invoice = '${path}' WHERE id = '${id}';
    `;
    const selectSql = `
      SELECT * FROM \`order\` WHERE id = '${id}';
    `;
    const updateSqlRes = await this.nativeQuery(updateSql);
    const selectSqlRes = await this.nativeQuery(selectSql);
    // return req;
    console.log(updateSqlRes, selectSqlRes);
    return selectSqlRes;
  }

  async getInvoiceInfo(id) {
    return await this.orderInfoEntity.findOne(id);
  }
  /**
   * 新增
   * @param param
   */
  async add(params) {
    return this.orderInfoEntity.save(params).then(async savedOrder => {
      const getDepartment = `
        SELECT * FROM \`base_sys_department\` WHERE id = '${savedOrder.departmentId}';
      `;
      const getDepartmentSearch = await this.nativeQuery(getDepartment);
      const departName = getDepartmentSearch[0].name;
      const quoteNumber = `${this.getInitials(departName)}${savedOrder.id
        .toString()
        .padStart(7, '0')}`;
      savedOrder.quoteNumber = quoteNumber;
      return this.orderInfoEntity.save(savedOrder);
    });
  }

  async generateToken(payload) {
    const secret = 'XIONWHEREICAN';
    const options = { expiresIn: '1h' }; // 令牌过期时间
    const token = jwt.sign(payload, secret, options);
    return token;
  }

  verifyToken(token) {
    const secret = 'XIONWHEREICAN';
    return new Promise((resolve, reject) => {
      jwt.verify(token, secret, (err, payload) => {
        if (err) {
          reject(err);
        } else {
          resolve(payload);
        }
      });
    });
  }

  getInitials(name) {
    const words = name.split(' ');
    let initials = '';

    words.forEach(word => {
      if (word.length > 0) {
        initials += word[0].toUpperCase();
      }
    });

    return initials;
  }

  async updateOrderById(
    id: number,
    updateData: Pick<
      OrderInfoEntity,
      'registrationDoc' | 'driverLicense' | 'vehiclePhoto'
    >
  ): Promise<OrderInfoEntity> {
    const order = await this.orderInfoEntity.findOne(id);
    if (!order) {
      throw new CoolCommException(`Order with ID ${id} not found.`);
    }
    if (!order.allowUpload) {
      throw new CoolCommException(
        'You do not have the permission to perform updates.'
      );
    }
    order.registrationDoc = updateData.registrationDoc ?? order.registrationDoc;
    order.driverLicense = updateData.driverLicense ?? order.driverLicense;
    order.imageFileDir = updateData.vehiclePhoto ?? order.vehiclePhoto;
    order.allowUpload = false;
    return this.orderInfoEntity.save(order);
  }

  async updateEmailStatus(
    id: number,
    giveUploadBtn: boolean
  ): Promise<OrderInfoEntity> {
    const order = await this.orderInfoEntity.findOne(id);
    if (!order) {
      throw new CoolCommException(`Order with ID ${id} not found.`);
    }
    if (!giveUploadBtn) {
      order.emailStatus = 1;
    }
    return this.orderInfoEntity.save(order);
  }

  async updateOrderAllowUpload(id: number, allowUpload: boolean) {
    const order = await this.orderInfoEntity.findOne(id);
    order.allowUpload = allowUpload;
    return this.orderInfoEntity.save(order);
  }

  async isAllowUpdate(id: number) {
    const order = await this.orderInfoEntity.findOne(id);
    return order.allowUpload;
  }

  async update(param) {
    const order = await this.orderInfoEntity.findOne(param.id);
    if (!order) {
      throw new CoolCommException(`Order with ID ${param.id} not found.`);
    }
    if (param.updateCreateTime) {
      param.createTime = () => 'NOW()';
    }
    return await this.orderInfoEntity.save(param);
  }

  async getCountCompleteJob(departmentId, startDate, endDate, status) {
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    if (startDate && endDate) {
      filter.createTime = Between(startDate, endDate);
    }
    filter.departmentId = departmentId;
    const count = await this.jobEntity.count({
      where: filter,
    });
    return [{ count }];
  }

  async updateOrderStatusAndDeleteJob(orderId: number) {
    return await this.jobEntity.find({
      orderID: orderId,
    });
  }

  async bookedUpdateStatus(
    orderId: number,
    order_status: number | null,
    job_status: number | null,
    job_info
  ) {
    const promise = [];
    const orderDetail = await this.orderInfoEntity.findOne({ id: orderId });
    console.log(orderDetail);
    if (orderDetail.carID) {
      promise.push(
        this.carEntity.update(
          {
            id: orderDetail.carID,
          },
          {
            status: 1,
            isVFP: false,
            carWreckedInfo: null,
          }
        )
      );
      promise.push(
        this.carWreckedEntity
          .find({
            carID: orderDetail.carID,
          })
          .then(res => {
            const ids = res.map(v => v.id);
            if (ids.length > 0) {
              this.carWreckedEntity.delete(ids);
            }
          })
      );
    }

    promise.push(
      this.jobEntity
        .findOne({
          orderID: orderId,
        })
        .then(async res => {
          if (res && res.id) {
            if (job_status >= 0) {
              res.status = job_status;
              if (job_status === 0) {
                res.driverID = null;
                res.schedulerEnd = null;
                res.schedulerStart = null;
              }
              await this.jobEntity.save(res);
            } else {
              await this.jobEntity.delete(res.id);
            }
          } else {
            if (job_info) {
              await this.jobEntity.save(job_info);
            }
          }
          return res;
        })
    );

    promise.push(
      this.update({
        id: orderId,
        status: order_status,
      })
    );

    return await Promise.all(promise)
      .then(() => true)
      .catch(() => false);
  }

  /**
   * 获取api token
   */

  cachedToken: {
    value: string | null;
    expiry: number | null;
  } = {
    value: null,
    expiry: null,
  };

  // async getAccessToken() {
  //   console.log(this.cachedToken);
  //   // 检查缓存的token是否存在且未过期
  //   if (this.cachedToken.value && this.cachedToken.expiry > Date.now()) {
  //     console.log("-------------------------------token not expire true");
  //     return this.cachedToken.value;
  //   }

  //   console.log("-------------------------------token not expire false");
  //     // 请求新的token
  //   const response = await axios.post(
  //     'https://api.dev.infoagent.com.au/auth/v1/token/oauth',
  //     {
  //       grant_type: 'client_credentials',
  //       client_id: 'MtDpkDIrb0gej6A2mJWP',
  //       // client_id: 'dvfwCPIFLmrJZKGEF6VP',
  //       client_secret: 'b23ed528-7cc1-469e-8df9-9a714e551280',
  //       // client_secret: '79e22f09-bf7e-46bc-ad4c-beda9185bb26',
  //     }
  //   );

  //   const { access_token, expires_in } = response.data;

  //   // 更新缓存的token和过期时间
  //   this.cachedToken = {
  //     value: access_token,
  //     expiry: Date.now() + expires_in * 1000 - 10000, // 提前10秒刷新token
  //   };

  //   console.log(this.cachedToken);

  //   return access_token;
  // }

  async fetchDataWithS1(registrationNumber, state) {
    const data = await axios
      .get('http://www.carregistrationapi.com/api/reg.asmx/CheckAustralia', {
        params: {
          RegistrationNumber: registrationNumber,
          State: state,
          username: 'smtm2099',
        },
        timeout: 8000, // 设置请求超时为5秒
      })
    console.log("========================S1", data.data);
    return data.data
  }

  async fetchDataWithV1(plate, state) {
    const accessToken = await this.accessTokenService.getAccessToken();
    const response = await axios.post(
      'https://api.infoagent.com.au/nevdis/v1/vehicle-report',
      {
        plate,
        state,
        products: [
          'VEHICLE_AGE',
          'EXTENDED_DATA',
          'HIGH_PERFORMANCE_INFO',
          'REGISTRATION',
          'DETAILS',
          'STOLEN_INFO',
          'WRITTEN_OFF_INFO',
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  }

  async fetchDataWithV2(plate, state) {
    const accessToken = await this.accessTokenService.getAccessToken();
    const response = await axios.post(
      'https://api.infoagent.com.au/ivds/v1/au/vehicle-report/enhanced-basic',
      {
        plate,
        state
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    console.log('success', response.data);
    return response.data;
  }

  async fetchDataWithV3(plate, state) {
    const accessToken = await this.accessTokenService.getAccessToken();
    const response = await axios.post(
      'https://api.infoagent.com.au/ivds/v1/au/vehicle-report/ppsr',
      {
        plate,
        state
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    console.log('success', response.data);
    return response.data;
  }
}

@Provide()
export class OrderActionService extends BaseService {
  @InjectEntityModel(OrderActionEntity)
  orderActionEntity: Repository<OrderActionEntity>;

  async add(params) {
    return this.orderActionEntity.save(params);
  }
}

