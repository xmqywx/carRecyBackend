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

  async getNumber(catalyticConverterNumber) {
    // CarWreckedInfo catalyticConverterNumber
    const sql = `SELECT * FROM \`car\`
    WHERE CarWreckedInfo->'$.catalyticConverterNumber' = '${catalyticConverterNumber}';`;
    const sqlSearch = await this.nativeQuery(sql);
    return sqlSearch;
  }
}