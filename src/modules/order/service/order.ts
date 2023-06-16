import {Provide} from "@midwayjs/decorator";
import {BaseService, CoolCommException} from "@cool-midway/core";
import {InjectEntityModel} from "@midwayjs/orm";
import {Repository} from "typeorm";
import {OrderInfoEntity} from "../entity/info";
import { OrderActionEntity } from "../entity/action";
import * as jwt from 'jsonwebtoken';

@Provide()
export class OrderService extends BaseService {
  @InjectEntityModel(OrderInfoEntity)
  orderInfoEntity: Repository<OrderInfoEntity>;
  @InjectEntityModel(OrderActionEntity)
  orderActionEntity: Repository<OrderActionEntity>;
  async getCountMonth(departmentId){
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
  async saveInvoice(id,path) {
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

  /**
   * 新增
   * @param param
   */
  async add(params) {
    return this.orderInfoEntity.save(params).then((savedOrder) => {
      const quoteNumber = `WPYC${savedOrder.id.toString().padStart(7, '0')}`;
      savedOrder.quoteNumber = quoteNumber;
      return this.orderInfoEntity.save(savedOrder);
    })
  }

  // async add(params) {
  //   // return this.
  // }
  generateToken(payload) {
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

  
  async updateOrderById(id: number, updateData: Pick<OrderInfoEntity, 'registrationDoc' | 'driverLicense' | 'vehiclePhoto'>): Promise<OrderInfoEntity> {
    const order = await this.orderInfoEntity.findOne(id);
    if (!order) {
      throw new CoolCommException(`Order with ID ${id} not found.`);
    }
    order.registrationDoc = updateData.registrationDoc ?? order.registrationDoc;
    order.driverLicense = updateData.driverLicense ?? order.driverLicense;
    order.vehiclePhoto = updateData.vehiclePhoto ?? order.vehiclePhoto;
    return this.orderInfoEntity.save(order);
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