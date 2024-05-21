import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { ContainerEntity } from '../entity/base';
import { CarWreckedEntity } from '../../car/entity/carWrecked';
import { BuyerEntity } from '../../buyer/entity/base';
@Provide()
export class ContainerService extends BaseService {
  @InjectEntityModel(ContainerEntity)
  containerEntity: Repository<ContainerEntity>;

  @InjectEntityModel(CarWreckedEntity)
  carWreckedEntity: Repository<CarWreckedEntity>;

  @InjectEntityModel(BuyerEntity)
  buyerEntity: Repository<BuyerEntity>;

  /**
   *  获取container number的数据
   *
   */
  async checkIsUniqueContainerNumber(containerNumber: string) {
    const containerSearchData = await this.containerEntity.find({
      containerNumber,
    });
    console.log(containerSearchData);
    return {
      isUnique: containerSearchData.length <= 0,
    };
  }

  async checkIsUniqueSealedNumber(sealNumber: string, id: number) {
    const containerSearchData = await this.containerEntity.find({ sealNumber });
    if (containerSearchData.length === 1) {
      return {
        isUnique: containerSearchData[0].id === id,
      };
    }
    return {
      isUnique: containerSearchData.length <= 0,
    };
  }

  async get_wrecker_container(departmentId: any, createBy: number) {
    const containerSearchData = await this.containerEntity.find({
      departmentId,
      createBy,
    });
    const containerFilterData = containerSearchData.filter(v => v.status !== 2);
    if (containerFilterData?.length > 0) {
      const containerDetail = containerFilterData[0];
      return {
        isExist: true,
        containerNumber: containerDetail.containerNumber,
        containerDetail,
      };
    } else {
      return {
        isExist: false,
      };
    }
  }

  /**
   * 获取container导出内容
   * @param param
   */
  async getContainerXlsxData(containerNumber) {
    let containerData = await this.containerEntity.findOne({
      containerNumber,
    });

    const searchPartsSql = `
      SELECT \`car_wrecked\`.*,\`car\`.carInfo FROM \`car_wrecked\` JOIN \`car\` ON \`car_wrecked\`.carID = \`car\`.id WHERE \`car_wrecked\`.containerNumber = '${containerNumber}'
    `;
    const searchSqlRes = await this.nativeQuery(searchPartsSql);
    return { containerData, partsData: searchSqlRes };
  }

  /**
   * 获取container零件价格总
   * @param param
   */
  async containerWidthAmountPage(params) {
    // 创建子查询以聚合carWrecked表的数据
    const carWreckedSubQuery = this.carWreckedEntity
      .createQueryBuilder('carWrecked')
      .select('carWrecked.containerID', 'containerID')
      .addSelect('SUM(carWrecked.paid)', 'totalPaid')
      .addSelect('SUM(carWrecked.deposit)', 'totalDeposit')
      .addSelect('SUM(carWrecked.sold)', 'totalSold')
      .groupBy('carWrecked.containerID');

    // 创建主查询，连接container表和聚合的carWrecked数据
    const queryBuilder = this.containerEntity
      .createQueryBuilder('container')
      .leftJoin(
        '(' + carWreckedSubQuery.getQuery() + ')',
        'carWreckedAggregated',
        'carWreckedAggregated.containerID = container.id'
      )
      .addSelect([
        'container.*', // 选择container表中的所有字段
        'carWreckedAggregated.totalPaid',
        'carWreckedAggregated.totalDeposit',
        'carWreckedAggregated.totalSold',
      ])
      .setParameters(carWreckedSubQuery.getParameters());

    // 应用过滤条件
    if (params.containerNumber) {
      queryBuilder.andWhere('container.containerNumber = :containerNumber', {
        containerNumber: params.containerNumber,
      });
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
