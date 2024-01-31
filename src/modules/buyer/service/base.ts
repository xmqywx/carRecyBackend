import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { BuyerEntity } from '../entity/base';
import { CarWreckedEntity } from '../../car/entity/carWrecked';
/**
 * 描述
 */
@Provide()
export class BuyerService extends BaseService {
  @InjectEntityModel(BuyerEntity)
  buyerEntity: Repository<BuyerEntity>;

  @InjectEntityModel(CarWreckedEntity)
  carWreckedEntity: Repository<CarWreckedEntity>;

  /**
   * 保存或更新buyer，将其添加给carWrecked
   */
  async addOrUpdateBuyerToCarWrecked(params: {
    id: number | null;
    name: string;
    phone: number;
    address: string;
  }, partID: number) {
    const {id, name, phone, address} = params;
    let finalID = null;
    if(id) {
        const findBuyerData = await this.buyerEntity.findOne({id});
        if(findBuyerData) {
            findBuyerData.name = name;
            findBuyerData.phone = phone;
            findBuyerData.address = address;
            await this.buyerEntity.update({id}, findBuyerData);
            finalID = id;
        }
    } else {
        let addData = await this.buyerEntity.save({
            name, phone, address
        });

        finalID = addData.id;
    }
    if(finalID) {
        await this.carWreckedEntity.update({id: partID}, {buyerID: finalID})
        return {
            buyerID: finalID
        };
    }
    return null;
  }
}
