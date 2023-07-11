import { Inject, Provide } from '@midwayjs/decorator';
import { BaseService,  } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import {CustomerProfileEntity} from "../entity/profile";
import {BaseSysPermsService} from "../../base/service/sys/perms";
import * as _ from 'lodash';

/**
 * 角色
 */
@Provide()
export class CustomerProfileService extends BaseService {
  @InjectEntityModel(CustomerProfileEntity)
  customerProfileEntity: Repository<CustomerProfileEntity>;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  ctx;
  // /**
  //  * 新增
  //  * @param param
  //  */
  // async add(param) {
  //   const exists = await this.customerProfileEntity.findOne({
  //     phoneNumber: param.phoneNumber,
  //   });
  //   if (!_.isEmpty(exists)) {
  //     throw new CoolCommException("Customer's phone number already exists.");
  //   }
  //   return await this.customerProfileEntity.save(param);
  // }
  
  // /**
  //  * 修改
  //  * @param param 数据
  //  */
  // async update(param) {
  //   const exists = await this.customerProfileEntity.findOne({
  //     phoneNumber: param.phoneNumber,
  //   });
  //   if (exists && exists.id !== param.id) {
  //     throw new CoolCommException("Customer's phone number already exists.");
  //   }
  //   await this.customerProfileEntity.save(param);
  // }

  /**
   * 刪除
   * @param roleId
   */
  async delete(ids) {
    await this.customerProfileEntity.save({ id: ids[0], isDel: true });
  }


}
