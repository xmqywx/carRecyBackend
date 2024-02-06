import {Provide} from "@midwayjs/decorator";
import { BaseService } from "@cool-midway/core";
import {InjectEntityModel} from "@midwayjs/orm";
import {Repository} from "typeorm";
import { ContainerEntity } from "../entity/base";
import { CarWreckedEntity } from "../../car/entity/carWrecked";
import { ContainerLogEntity } from "../entity/container-logs";
import { BuyerEntity } from "../../buyer/entity/base";
@Provide()
export class ContainerService extends BaseService {
  @InjectEntityModel(ContainerEntity)
  containerEntity: Repository<ContainerEntity>;

  @InjectEntityModel(CarWreckedEntity)
  carWreckedEntity: Repository<CarWreckedEntity>;

  @InjectEntityModel(ContainerLogEntity)
  containerLogEntity: Repository<ContainerLogEntity>;

  @InjectEntityModel(BuyerEntity)
  buyerEntity: Repository<BuyerEntity>;
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
    console.log(containerSearchData);
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

  async change_container_status({status, containerID, areEnginesComplete, areEnginesRunningWell, anyIssues, statusChangeTime, issues}) {
    const containerSearchData = await this.containerEntity.findOne({ id: containerID });
    containerSearchData.status = status;
    const saveStatus = await this.containerEntity.save(containerSearchData);
    console.log(saveStatus);
    this.containerLogEntity.save({
      containerID,
      areEnginesComplete,
      areEnginesRunningWell,
      anyIssues,
      issues,
      statusChangeTime,
      statusTo: status
    })
  }

  // async page(query, options, connectionName) {
  //   const { noSealed, isOversea } = query;
  //   let where = [];
  // // 确保noSealed和isOversea不会同时为true
  // if (noSealed && !isOversea) {
  //   where.push('container.status < 2');
  // } else if (isOversea) {
  //   where.push('container.status >= 2');
  // }
  // // 看下如何才能够将两个表融合

  // const [result, total] = await this.containerEntity
  // .createQueryBuilder('c')
  // .leftJoin('buyer', 'b', 'b.id = c.consigneeID')
  // .select(['c', 'b.name', 'b.address', 'b.phone'])
  // .where(where.join(' AND '))
  // .skip(query.page && query.size ? (query.page - 1) * query.size : 0)
  // .take(query.size)
  // .getManyAndCount();


  //   return {
  //     list: result,
  //     pagination: {
  //       total: total,
  //       size: query.size,
  //       page: query.page,
  //     },
  //   };
  // }
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

  async containerWidthAmountPage(params) {
    // 创建子查询以聚合carWrecked表的数据
    const carWreckedSubQuery = this.carWreckedEntity.createQueryBuilder('carWrecked')
      .select('carWrecked.containerNumber', 'containerNumber')
      .addSelect('SUM(carWrecked.paid)', 'totalPaid')
      .addSelect('SUM(carWrecked.deposit)', 'totalDeposit')
      .addSelect('SUM(carWrecked.sold)', 'totalSold')
      .groupBy('carWrecked.containerNumber');
  
    // 创建主查询，连接container表和聚合的carWrecked数据
    const queryBuilder = this.containerEntity.createQueryBuilder('container')
      .leftJoin('(' + carWreckedSubQuery.getQuery() + ')', 'carWreckedAggregated', 'carWreckedAggregated.containerNumber = container.containerNumber')
      .addSelect([
        'container.*', // 选择container表中的所有字段
        'carWreckedAggregated.totalPaid', 
        'carWreckedAggregated.totalDeposit', 
        'carWreckedAggregated.totalSold'
      ])
      .setParameters(carWreckedSubQuery.getParameters());
  
    // 应用过滤条件
    if (params.containerNumber) {
      queryBuilder.andWhere('container.containerNumber = :containerNumber', { containerNumber: params.containerNumber });
    }
  
    // 获取总记录数
    const total = await queryBuilder.getCount();
  
    // 应用分页
    const page = params.page || 1; // 默认第一页
    const size = params.size || 10; // 默认每页10条
    queryBuilder.skip((page - 1) * size).take(size);
  
    const result = await queryBuilder.getRawMany();
  
    // 返回结果和分页信息
    return {
      data: result,
      pagination: {
        page: page,
        size: size,
        total: total,
      },
    };
  }
}