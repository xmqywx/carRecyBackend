import {Provide} from "@midwayjs/decorator";
import {BaseService} from "@cool-midway/core";
import {InjectEntityModel} from "@midwayjs/orm";
import {Repository} from "typeorm";
import { CarCommentEntity } from "../entity/comment";
import { CarWreckedEntity } from "../entity/carWrecked";
import { CarEntity } from "../entity/base";

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

  async getWreckedInfo(dn: string) {
    return this.carWreckedEntity.findOne({ disassemblyNumber: dn });
  }

  async getWreckedInfos(carID: number, disassemblyCategory?: string) {
    const searchData: {[key: string]: any} = {carID: Number(carID)};
    if(disassemblyCategory) {
      let category = '';
      if(disassemblyCategory === 'CatalyticConverter') {
        category = 'Catalytic Converter';
      } else if(disassemblyCategory === 'ExtraPartstoExtract') {
        category = 'Extra Parts to Extract';
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
}

@Provide()
export class CarBaseService extends BaseService {
  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;

  async getOneCarInfo(id: number) {
    return await this.carEntity.findOne({id});
  }
}