import { Provide } from "@midwayjs/decorator";
import { BaseService, CoolCommException } from "@cool-midway/core";
import { InjectEntityModel } from "@midwayjs/orm";
import { Repository, Between } from "typeorm";
import { OrderInfoEntity } from "../entity/info";
import { OrderActionEntity } from "../entity/action";
import { JobEntity } from "../../job/entity/info";
import { CarWreckedEntity } from "../../car/entity/carWrecked";
import { CarEntity } from "../../car/entity/base";
import * as jwt from 'jsonwebtoken';

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


  async getCountMonth(departmentId) {
    const year = new Date().getFullYear();
    const sql = `
        SELECT DATE_FORMAT(createTime,'%m') as month, count(*) as count FROM \`order\` WHERE
        DATE_FORMAT(createTime,'%Y') = '${year}'
          and departmentId = ${departmentId}
          and ( status = 1 or status = 3)
          GROUP BY DATE_FORMAT(createTime,'%m');`
    const sql2 = `
        SELECT DATE_FORMAT(createTime,'%m') as month, count(*) as count FROM \`order\` WHERE
        DATE_FORMAT(createTime,'%Y') = '${year}'
          and departmentId = ${departmentId}
          GROUP BY DATE_FORMAT(createTime,'%m');
    `
    const list1 = await this.nativeQuery(sql)
    const list2 = await this.nativeQuery(sql2)
    return {
      order: list1,
      lead: list2
    }
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
    return this.orderInfoEntity.save(params).then(async (savedOrder) => {
      const getDepartment = `
        SELECT * FROM \`base_sys_department\` WHERE id = '${savedOrder.departmentId}';
      `;
      const getDepartmentSearch = await this.nativeQuery(getDepartment);
      const departName = getDepartmentSearch[0].name;
      const quoteNumber = `${this.getInitials(departName)}${savedOrder.id.toString().padStart(7, '0')}`;
      savedOrder.quoteNumber = quoteNumber;
      return this.orderInfoEntity.save(savedOrder);
    })
  }

  // async add(params) {
  //   // return this.
  // }
  async generateToken(payload) {
    const secret = "XIONWHEREICAN";
    const options = { expiresIn: '1h' }; // 令牌过期时间
    const token = jwt.sign(payload, secret, options);
    return token;
  }

  verifyToken(token) {
    const secret = "XIONWHEREICAN";
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

  async updateOrderById(id: number, updateData: Pick<OrderInfoEntity, 'registrationDoc' | 'driverLicense' | 'vehiclePhoto'>): Promise<OrderInfoEntity> {
    const order = await this.orderInfoEntity.findOne(id);
    if (!order) {
      throw new CoolCommException(`Order with ID ${id} not found.`);
    }
    if (!order.allowUpload) {
      throw new CoolCommException(`You do not have the permission to perform updates.`);
    }
    order.registrationDoc = updateData.registrationDoc ?? order.registrationDoc;
    order.driverLicense = updateData.driverLicense ?? order.driverLicense;
    order.vehiclePhoto = updateData.vehiclePhoto ?? order.vehiclePhoto;
    order.allowUpload = false;
    return this.orderInfoEntity.save(order);
  }

  async updateEmailStatus(id: number, giveUploadBtn: boolean): Promise<OrderInfoEntity> {
    const order = await this.orderInfoEntity.findOne(id);
    if (!order) {
      throw new CoolCommException(`Order with ID ${id} not found.`);
    }
    if (!giveUploadBtn) {
      order.emailStatus = 1;
    }
    return this.orderInfoEntity.save(order);
  }
  // async updateEmailStatus(id: number, giveUploadBtn: boolean): Promise<OrderInfoEntity> {
  //   const order = await this.orderInfoEntity.findOne(id);
  //   if (!order) {
  //     throw new CoolCommException(`Order with ID ${id} not found.`);
  //   }
  //   if (!order.allowUpload) {
  //     throw new CoolCommException(`You do not have the permission to perform updates.`);
  //   }

  //   let status: number;
  //   if (giveUploadBtn) {
  //     status = (order.emailStatus === 1 || order.emailStatus === 3) ? 3 : 2;
  //   } else {
  //     status = (order.emailStatus === 2 || order.emailStatus === 3) ? 3 : 1;
  //   }

  //   order.emailStatus = status;
  //   return this.orderInfoEntity.save(order);
  // }
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
    // console.log(startDate, endDate)
    // const query = `
    // SELECT COUNT(*) AS count
    // FROM \`order\`
    // WHERE id IN (
    //   SELECT orderID
    //   FROM \`job\`
    //   WHERE status = 4
    // )
    // AND departmentId = '${departmentId}'
    // ${startDate && endDate ? `AND (createTime BETWEEN '${startDate}' AND '${endDate}')` : ''}
    // `;

    // return await this.nativeQuery(query);
    const filter: any = {}
    if (status != undefined) {
      filter.status = status;
    }
    if(startDate && endDate) {
      filter.createTime = Between(startDate, endDate);
    }
    filter.departmentId = departmentId
    // if (status != undefined) {
    //   filter.departmentId = departmentId;
    // }
    const count = await this.jobEntity.count({
      where: filter
    })
    return [{count}];
  }

  async updateOrderStatusAndDeleteJob(orderId: number) {
    // return await this.update({
    //   id: 657,
    //   status: 0
    // });
    return await this.jobEntity.find({
      orderID: orderId
    })
  }

  async bookedUpdateStatus(orderId: number, order_status: number | null, job_status: number | null, job_info) {
    const promise = [];
    const orderDetail = await this.orderInfoEntity.findOne({id: orderId})
    console.log(orderDetail);
    if(orderDetail.carID) {
      promise.push(this.carEntity.update({
        id: orderDetail.carID,
      }, {
        status: 1,
        isVFP: false,
        CarWreckedInfo: null
      }));
      promise.push(this.carWreckedEntity.find({
        carID: orderDetail.carID
      }).then(res => {
        const ids = res.map(v => v.id);
        if(ids.length > 0) {
          this.carWreckedEntity.delete(ids);
        }
      }))
    }

    promise.push(this.jobEntity.findOne({
      orderID: orderId
    }).then(async res => {
      if(res && res.id) {
        if(job_status >= 0) {
          res.status = job_status;
          await this.jobEntity.save(res);
        } else {
          await this.jobEntity.delete(res.id);
        }
      } else {
        if(job_info) {
          await this.jobEntity.save(job_info);
        }
      }
      return res;
    }));

    promise.push(this.update({
      id: orderId,
      status: order_status
    }));

    return await Promise.all(promise).then(() => true).catch(() => false);
    // if(job_status !== 0) {
    //   //booked -> booked(completed), orderId = ?, order_status = 1, job_status = 4
    //   //booked(completed) -> booked, orderId = ?, order_status = 1, job_status = 1
    //   if(findJob[0]?.id) {
    //     findJob[0].status = job_status;
    //     this.jobEntity.save(findJob[0]);
    //   }
    // } else {
    //   //booked -> lead, orderId = ?, order_status = 0, job_status = null
    //   if(findJob[0]?.id) {
    //     await this.jobEntity.delete(findJob[0].id);
    //   }
    // }
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