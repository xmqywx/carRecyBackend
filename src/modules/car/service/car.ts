import {Provide} from "@midwayjs/decorator";
import {BaseService} from "@cool-midway/core";
import {InjectEntityModel} from "@midwayjs/orm";
import {Repository} from "typeorm";
import { CarCommentEntity } from "../entity/comment";
import { CarWreckedEntity } from "../entity/carWrecked";
import { CarEntity } from "../entity/base";
import { ContainerEntity } from "../../container/entity/base";

@Provide()
export class CarCommentService extends BaseService {
  @InjectEntityModel(CarCommentEntity)
  crderActionEntity: Repository<CarCommentEntity>;
  
  async add(params) {
    return this.crderActionEntity.save(params);
  }
}

@Provide()
export class CarWreckedService extends BaseService {
  @InjectEntityModel(CarWreckedEntity)
  carWreckedEntity: Repository<CarWreckedEntity>;

  @InjectEntityModel(ContainerEntity)
  containerEntity: Repository<ContainerEntity>;

  async getWreckedInfo(dn: string) {
    return this.carWreckedEntity.findOne({ disassemblyNumber: dn });
  }

  async getWreckedInfos(carID: number, disassemblyCategory?: string) {
    const searchData: {[key: string]: any} = {carID: Number(carID)};
    if(disassemblyCategory) {
      let category = '';
      if(disassemblyCategory === 'CatalyticConverter') {
        category = 'Catalytic Converter';
      } else if(disassemblyCategory === 'ExtraPartExtraction') {
        category = 'Extra Part Extraction';
      } else if(disassemblyCategory === 'DismantlingLabels') {
        category = 'Dismantling Labels';
      } else {
        category = disassemblyCategory;
      }
      searchData.disassemblyCategory = category;
    }
    console.log(searchData, await this.carWreckedEntity.find(searchData));
    return await this.carWreckedEntity.find(searchData);
  }

  /**
   * 新增
   * @param param
   */
  async add(params) {
    return this.carWreckedEntity.save(params).then(async (wreckedInfo) => {
      const cate = disassemblyCategorys[wreckedInfo.disassemblyCategory];
      wreckedInfo.disassemblyNumber = cate+ wreckedInfo.id;
      return await this.carWreckedEntity.save(wreckedInfo);
    })
  }

  async handleDisassemble(params: any) {
    const promise = [];
    if(params.dismantlingLabelsData) {
      params.dismantlingLabelsData.forEach(v => {
        if(v.name === "Other") {
          v.others.forEach(pt => {
            promise.push(this.add({
              carID: params.carID,
              disassemblyDescription: pt.value,
              disassemblyCategory: 'Dismantling Labels',
              disassmblingInformation: pt.name,
            }))
          })
          return;
        }
        v.parts.forEach(pt => {
          promise.push(this.add({
            carID: params.carID,
            disassemblyDescription: pt.description,
            disassemblyCategory: 'Dismantling Labels',
            disassmblingInformation: v.name,
          }))
        })
      })
    }
    if(params.extraPartsExtractData) {
      params.extraPartsExtractData.forEach(v => {
        if(v.name === "Other") {
          v.others.forEach(pt => {
            promise.push(this.add({
              carID: params.carID,
              disassemblyDescription: pt.value,
              disassemblyCategory: 'Extra Part Extraction',
              disassmblingInformation: pt.name,
            }))
          })
          return;
        }
        v.parts.forEach(pt => {
          promise.push(this.add({
            carID: params.carID,
            disassemblyDescription: pt.description,
            disassemblyCategory: 'Extra Part Extraction',
            disassmblingInformation: v.name,
          }))
        })
      })
    }
    if(params.activeCarForm?.catalyticConverters?.length > 0) {
      const ccs = params.activeCarForm.catalyticConverters;
      ccs.forEach(item => {
        promise.push(this.add({
          carID: params.carID,
          disassemblyCategory: 'Catalytic Converter',
          disassmblingInformation: item.catalyticConverterPhotos,
          catalyticConverterName: item.catalyticConverterName,
          catalyticConverterNumber: item.catalyticConverterNumber
        }))
      })
    }
    return await Promise.all(promise);
  }

  async getWreckedNumber(catalyticConverterNumber) {
    return this.carWreckedEntity.find({
      catalyticConverterNumber
    });
  }

  // 将零件从集装箱中移除
  async moveOutFromContainer(id: number, containerNumber: string) {
    await this.carWreckedEntity.save({
      id,
      containerNumber: null
    });
    const containerPartsList = await this.carWreckedEntity.find({
      containerNumber
    });

    if(containerPartsList.length <= 0) {
      const containerItem = await this.containerEntity.findOne({
        containerNumber
      })
      if(!containerItem) return;
      containerItem.status = 0;
      this.containerEntity.save(containerItem);
    }
  }

  // 将零件添加到集装箱中
  async putToContainer(partId: number, containerNumber: string) {
    await this.carWreckedEntity.save({
      id: partId,
      containerNumber: containerNumber
    });

    const containerItem = await this.containerEntity.findOne({
      containerNumber
    })
    if(!containerItem) return;
    if(containerItem.status === 0) {
      containerItem.status = 1;
      this.containerEntity.save(containerItem);
    }
  }

  //通过id 或 partId查询
  async infoByDn(partId: string) {
    return await this.carWreckedEntity.findOne({
      disassemblyNumber: partId
    }).then(async (res: any) => {
      if(res.containerNumber !== null) {
        let containerInfo = await this.containerEntity.findOne({
          containerNumber: res.containerNumber
        });
        res.containerStatus = containerInfo?.status;
      }

      return res;
    });
  }

  async handleToGetCarWreckedTotal(filters: {[key:string]: any}) {
    const { isSold, isPaid, collected, isDeposit, containerNumber, noSold, noPaid, noDeposit, lowestSoldPrice, highestSoldPrice } = filters;
    console.log(filters)
    let total = {
      sold: 0,
      collected: 0,
      paid: 0,
      deposit: 0
    };

    const query = this.carWreckedEntity.createQueryBuilder();

    if(containerNumber) {
      query.andWhere("containerNumber = :containerNumber");
    }

    if(isSold) {
      query.andWhere("sold IS NOT NULL AND sold > 0");
    }

    if(collected) {
      query.andWhere("collected = :collected", { collected: true });
    }

    if(isPaid) {
      query.andWhere("paid IS NOT NULL AND paid > 0");
    }

    if(isDeposit) {
      query.andWhere("deposit IS NOT NULL AND deposit > 0");
    }
    if(noSold) {
      query.andWhere("(sold IS NULL OR sold = 0)");
    }

    if(noPaid) {
      query.andWhere("(paid IS NULL OR paid = 0)");
    }

    if(noDeposit) {
      query.andWhere("(deposit IS NULL OR deposit = 0)");
    }

    if(lowestSoldPrice) {
      query.andWhere("sold = (SELECT MIN(sold) FROM car_wrecked WHERE sold IS NOT NULL)");
    }

    if(highestSoldPrice) {
      query.andWhere("sold = (SELECT MAX(sold) FROM car_wrecked WHERE sold IS NOT NULL)");
    }

    query.setParameter('containerNumber', containerNumber);

    const results = await query.getMany();

    results.forEach(result => {
      total.sold += Number(result.sold) || 0;
      total.collected += result.collected ? 1 : 0;
      total.paid += Number(result.paid) || 0;
      total.deposit += Number(result.deposit) || 0;
    });

    return total;
  }
}

const disassemblyCategorys = {
  'Dismantling Labels': 'DL',
  'Extra Part Extraction': 'EPE',
  'Catalytic Converter': 'CC'
}
@Provide()
export class CarBaseService extends BaseService {
  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;

  async getOneCarInfo(id: number) {
    return await this.carEntity.findOne({id});
  }

  // async getNumber(catalyticConverterNumber) {
  //   // CarWreckedInfo catalyticConverterNumber
  //   const sql = `SELECT * FROM \`car\`
  //   WHERE CarWreckedInfo->'$.catalyticConverterNumber' = '${catalyticConverterNumber}';`;
  //   const sqlSearch = await this.nativeQuery(sql);
  //   return sqlSearch;
  // }

  async getNumber(catalyticConverterNumber) {
    // 使用参数化查询来防止SQL注入
    const sql = `SELECT * FROM car
    WHERE JSON_CONTAINS(CarWreckedInfo->'$.infos.activeCarForm.catalyticConverters', 
    JSON_OBJECT('catalyticConverterNumber', ?), 
    '$')`;
  
    // 使用参数化查询的方法执行SQL
    const sqlSearch = await this.carEntity.query(sql, [catalyticConverterNumber]);
    return sqlSearch;
  }

  async changeCarStatus(status: number, id: number) {
    return await this.carEntity.update({
      id
    }, {
      status
    })
  }
}