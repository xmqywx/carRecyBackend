import { Inject, Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { CacheManager } from '@midwayjs/cache';
import { BaseSysVehicleEntity } from '../../entity/sys/vehicle';

/**
 * 系统用户
 */
@Provide()
export class BaseSysVehicleService extends BaseService {
  @InjectEntityModel(BaseSysVehicleEntity)
  baseSysVehicleEntity: Repository<BaseSysVehicleEntity>;

  @Inject()
  cacheManager: CacheManager;

  @Inject()
  ctx;
  //
  /**
   * 新增
   * @param param
   */
  async add(param) {
    await this.baseSysVehicleEntity.save(param);
    return param.id;
  }
}
