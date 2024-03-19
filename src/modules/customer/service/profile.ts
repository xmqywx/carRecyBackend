import { Inject, Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { CustomerProfileEntity } from '../entity/profile';
import { BaseSysPermsService } from '../../base/service/sys/perms';
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

  /**
   * 刪除
   * @param roleId
   */
  async delete(ids) {
    await this.customerProfileEntity.save({ id: ids[0], isDel: true });
  }
}
