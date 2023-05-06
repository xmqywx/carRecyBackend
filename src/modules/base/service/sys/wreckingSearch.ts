import { Inject, Provide, Config } from '@midwayjs/decorator';
import { BaseService, CoolCommException, RESCODE } from '@cool-midway/core';
import { CarBodyEntity } from '../../../car/entity/body';
import { CarEngineEntity } from '../../../car/entity/engine';
import { CarCatalyticConverterEntity } from '../../../car/entity/catalyticConverter';
import { CarEntity } from '../../../car/entity/base';
import { Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/orm';
import * as _ from 'lodash';
import { Context } from '@midwayjs/koa';


/**
 * 登录
 */
@Provide()
export class BaseWreckingSearchService extends BaseService {

  @InjectEntityModel(CarBodyEntity)
  carBodyEntity: Repository<CarBodyEntity>;

  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;

  @InjectEntityModel(CarEngineEntity)
  carEngineEntity: Repository<CarEngineEntity>;

  @InjectEntityModel(CarCatalyticConverterEntity)
  carCatalyticConverterEntity: Repository<CarCatalyticConverterEntity>;

  @Inject()
  ctx: Context;

  @Config('module.base')
  coolConfig;

  async getBody( id ) {

    const bodyData = await this.carBodyEntity.findOne({ carID: Number(id) });
    if(Object.keys(bodyData).length === 0) {
        return null;
    }
    const carData = await this.carEntity.findOne({id : bodyData.carID});
    return {data: {...bodyData}, car: {...carData}};
  }

  async getEngine(id) {
    const engineData = await this.carEngineEntity.findOne({ carID: Number(id) });
    if(Object.keys(engineData).length === 0) {
        return null;
    }
    const carData = await this.carEntity.findOne({id : engineData.carID});
    return {data: {...engineData}, car: {...carData}};
  }

  async getCatalyticConverter(id) {
    const catalyticConverterData = await this.carCatalyticConverterEntity.findOne({ carID: Number(id) });
    if(Object.keys(catalyticConverterData).length === 0) {
        return null;
    }
    const carData = await this.carEntity.findOne({id : catalyticConverterData.carID});
    return {data: {...catalyticConverterData}, car: {...carData}};
  }


}
