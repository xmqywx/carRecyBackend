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
    const searchData: {[key: string]: any} = {carID};
    if(disassemblyCategory) {
      searchData.disassemblyCategory = disassemblyCategory;
    }
    return this.carWreckedEntity.find(searchData);
  }
}

@Provide()
export class CarBaseService extends BaseService {
  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;

  async getOneCarInfo(id: number) {
    return this.carEntity.findOne({id});
  }
}