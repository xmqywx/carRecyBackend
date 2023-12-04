import {Provide} from "@midwayjs/decorator";
import { BaseService } from "@cool-midway/core";
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
  // /**
  //  * 新增
  //  * @param param
  //  */
  // async add(params) {
  //   return this.containerEntity.save(params).then(async (savedContainer) => {
  //     const containerNumber = `MRKU${savedContainer.id.toString().padStart(7, '0')}`;
  //     savedContainer.containerNumber = containerNumber;
  //     return this.containerEntity.save(savedContainer);
  //   })
  // }
  /**
   *  获取container number的数据
   * 
   */
  async checkIsUniqueContainerNumber(containerNumber: string) {
    const containerSearchData = await this.containerEntity.find({ containerNumber });
    return {
      isUnique: containerSearchData.length <= 0
    };
  }

  
  async checkIsUniqueSealedNumber(sealNumber: string, id: number) {
    const containerSearchData = await this.containerEntity.find({ sealNumber });
    if(containerSearchData.length === 1) {
      return {
        isUnique: containerSearchData[0].id === id
      };
    }
    return {
      isUnique: containerSearchData.length <= 0
    };
  }

  async get_wrecker_container(departmentId: any, createBy: number) {
    const containerSearchData = await this.containerEntity.find({ departmentId, createBy });
    const containerFilterData = containerSearchData.filter(v => v.status !== 2);
    if(containerFilterData?.length > 0) {
      const containerDetail = containerFilterData[0];
      // const components = await this.carWreckedEntity.find({
      //   containerNumber: containerDetail.containerNumber
      // });
      return {
        isExist: true,
        containerNumber: containerDetail.containerNumber,
        containerDetail,
        // components
      };
    } else {
      return {
        isExist: false
      };
    }
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
    // let partsData = await this.carWreckedEntity.find({
    //   containerNumber
    // })
    const searchPartsSql = `
      SELECT \`car_wrecked\`.*,\`car\`.carInfo FROM \`car_wrecked\` JOIN \`car\` ON \`car_wrecked\`.carID = \`car\`.id WHERE \`car_wrecked\`.containerNumber = '${containerNumber}'
    `;
    const searchSqlRes = await this.nativeQuery(searchPartsSql);
    return {containerData, partsData: searchSqlRes}
  }
}