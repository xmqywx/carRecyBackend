import { Inject, Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { SecondaryPersonEntity } from '../entity/profile';
import { BaseSysPermsService } from '../../base/service/sys/perms';

/**
 * 角色
 */
@Provide()
export class SecondaryPersonService extends BaseService {
  @InjectEntityModel(SecondaryPersonEntity)
  SecondaryPersonEntity: Repository<SecondaryPersonEntity>;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  ctx;

  /**
   * 刪除
   * @param roleId
   */
  async delete(ids) {
    await this.SecondaryPersonEntity.save({ id: ids[0], isDel: true });
  }
}
