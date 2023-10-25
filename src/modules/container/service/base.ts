import {Provide} from "@midwayjs/decorator";
import { BaseService, CoolCommException } from "@cool-midway/core";
import {InjectEntityModel} from "@midwayjs/orm";
import {Repository} from "typeorm";
import { ContainerEntity } from "../entity/base";
import { CarWreckedEntity } from "../../car/entity/carWrecked";

@Provide()
export class ContainerService extends BaseService {
  @InjectEntityModel(ContainerEntity)
  containerEntity: Repository<ContainerEntity>;

  @InjectEntityModel(CarWreckedEntity)
  carWreckedEntity: Repository<CarWreckedEntity>;
  /**
   * 新增
   * @param param
   */
  async add(params) {
    return this.containerEntity.save(params).then(async (savedContainer) => {
      const containerNumber = `MRKU${savedContainer.id.toString().padStart(7, '0')}`;
      savedContainer.containerNumber = containerNumber;
      return this.containerEntity.save(savedContainer);
    })
  }

  // /**
  //  * 更新
  //  * @param param
  //  */
  // async update(param) {
  //   const container = await this.containerEntity.findOne(param.id);
  //   if (!container) {
  //     throw new CoolCommException(`Container with ID ${param.id} not found.`);
  //   }
  //   if(container.status === 3) {

  //   }
  //   return await this.containerEntity.save(param);
  // }

  /**
   * 文件内容
   * @param param
   */
  async getContainerXlsxData(containerNumber) {

    let containerData = await this.containerEntity.findOne({
      containerNumber
    })
    let partsData = await this.carWreckedEntity.find({
      containerNumber
    })
    return {containerData, partsData}
  }
}