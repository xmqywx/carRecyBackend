import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { BuyerEntity } from '../entity/base';
import { CarWreckedEntity } from '../../car/entity/carWrecked';
import { PartTransactionsEntity } from '../../partTransactions/entity/base';
import { ContainerEntity } from '../../container/entity/base';
import { CarPartsEntity } from '../../car/entity/carParts';
/**
 * 描述
 */
@Provide()
export class BuyerService extends BaseService {
  @InjectEntityModel(BuyerEntity)
  buyerEntity: Repository<BuyerEntity>;

  @InjectEntityModel(CarWreckedEntity)
  carWreckedEntity: Repository<CarWreckedEntity>;

  @InjectEntityModel(PartTransactionsEntity)
  partTransactionsEntity: Repository<PartTransactionsEntity>;

  @InjectEntityModel(ContainerEntity)
  containerEntity: Repository<ContainerEntity>;

  @InjectEntityModel(CarPartsEntity)
  carPartsEntity: Repository<CarPartsEntity>;

  /**
   * 保存或更新buyer，将其添加给carWrecked
   */
  async addOrUpdateBuyerToCarWrecked(
    params: {
      id: number | null;
      name: string;
      phone: string;
      address: string;
      type: number;
    },
    partID: number
  ) {
    const { id, name, phone, address, type } = params;
    let finalID = null;
    if (id) {
      const findBuyerData = await this.buyerEntity.findOne({ id });
      if (findBuyerData) {
        findBuyerData.name = name;
        findBuyerData.phone = phone;
        findBuyerData.address = address;
        findBuyerData.type = type;
        await this.buyerEntity.update({ id }, findBuyerData);
        finalID = id;
      }
    } else {
      let addData = await this.buyerEntity.save({
        name,
        phone,
        address,
        type,
      });

      finalID = addData.id;
    }
    if (finalID) {
      try {
        const info = await this.carPartsEntity.findOne({ id: partID });
        // info.buyerID = finalID;
        const containerItem = await this.containerEntity.findOne({
          id: info.containerID,
        });
        await this.carPartsEntity.save(info);
        await this.partTransactionsEntity
          .findOne({ carWreckedID: partID, status: 0 })
          .then(async ptRes => {
            let pt = {};
            if (ptRes) {
              ptRes.buyerID = finalID;
              pt = ptRes;
            } else {
              pt = {
                carWreckedID: partID,
                status: 0,
                buyerID: finalID,
                billNo: `${info.disassemblyNumber}${
                  containerItem ? ' ' + containerItem.containerNumber : ''
                }`,
              };
            }
            await this.partTransactionsEntity.save(pt);
          });
        return {
          buyerID: finalID,
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /**
   * 保存或更新Container，将其添加给Container
   */
  async addOrUpdateCollectorToCarWrecked(
    params: {
      id: number | null;
      name: string;
      phone: string;
      address: string;
      type: number;
    },
    partID: number
  ) {
    const { id, name, phone, address, type } = params;
    let finalID = null;
    if (id) {
      const findBuyerData = await this.buyerEntity.findOne({ id });
      if (findBuyerData) {
        findBuyerData.name = name;
        findBuyerData.phone = phone;
        findBuyerData.address = address;
        findBuyerData.type = type;
        await this.buyerEntity.update({ id }, findBuyerData);
        finalID = id;
      }
    } else {
      let addData = await this.buyerEntity.save({
        name,
        phone,
        address,
        type,
      });

      finalID = addData.id;
    }
    if (finalID) {
      try {
        // await this.carPartsEntity.update(
        //   { id: partID },
        //   { collectorID: finalID }
        // );
        await this.partTransactionsEntity
          .findOne({ carWreckedID: partID, status: 0 })
          .then(async ptRes => {
            let pt = {};
            if (ptRes) {
              ptRes.collectorID = finalID;
              pt = ptRes;
            } else {
              pt = {
                carWreckedID: partID,
                status: 0,
                collectorID: finalID,
              };
            }
            await this.partTransactionsEntity.save(pt);
          });
        return {
          buyerID: finalID,
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /**
   * 保存或更新Container，将其添加给Container
   */
  async addOrUpdateConsigneeToContainer(
    params: {
      id: number | null;
      name: string;
      phone: string;
      address: string;
      type: number;
    },
    partID: number
  ) {
    const { id, name, phone, address, type } = params;
    let finalID = null;
    if (id) {
      const findBuyerData = await this.buyerEntity.findOne({ id });
      if (findBuyerData) {
        findBuyerData.name = name;
        findBuyerData.phone = phone;
        findBuyerData.address = address;
        findBuyerData.type = type;
        await this.buyerEntity.update({ id }, findBuyerData);
        finalID = id;
      }
    } else {
      let addData = await this.buyerEntity.save({
        name,
        phone,
        address,
        type,
      });

      finalID = addData.id;
    }
    if (finalID) {
      return {
        consigneeID: finalID,
      };
    }
    return null;
  }
}
