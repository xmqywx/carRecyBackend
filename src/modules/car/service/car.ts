import { Provide, Inject } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { CarCommentEntity } from '../entity/comment';
import { CarWreckedEntity } from '../entity/carWrecked';
import { CarEntity } from '../entity/base';
import { OrderInfoEntity } from '../../order/entity/info';
import { ContainerEntity } from '../../container/entity/base';
import { PartLogEntity } from '../../partLog/entity/base';
import { PartTransactionsEntity } from '../../partTransactions/entity/base';
import { CarPartsEntity } from '../entity/carParts';
import { CarLabelsEntity } from '../entity/carLabels';
import { CarCatalyticConverterEntity } from '../entity/carCatalyticConverter';
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

  @InjectEntityModel(PartLogEntity)
  partLogEntity: Repository<PartLogEntity>;

  @InjectEntityModel(PartTransactionsEntity)
  partTransactionsEntity: Repository<PartTransactionsEntity>;

  @Inject()
  ctx;

  async getWreckedInfo(dn: string) {
    return this.carWreckedEntity.findOne({ disassemblyNumber: dn });
  }

  async getWreckedInfos(carID: number, disassemblyCategory?: string) {
    const searchData: { [key: string]: any } = { carID: Number(carID) };
    // if (disassemblyCategory) {
    //   let category = '';
    //   if (disassemblyCategory === 'CatalyticConverter') {
    //     category = 'Catalytic Converter';
    //   } else if (disassemblyCategory === 'ExtraPartExtraction') {
    //     category = 'Extra Part Extraction';
    //   } else if (disassemblyCategory === 'DismantlingLabels') {
    //     category = 'Dismantling Labels';
    //   } else {
    //     category = disassemblyCategory;
    //   }
    //   searchData.disassemblyCategory = category;
    // }
    console.log(searchData, await this.carWreckedEntity.find(searchData));
    return await this.carWreckedEntity.find(searchData);
  }

  /**
   * 新增
   * @param param
   */
  async add(params) {
    return this.carWreckedEntity.save(params).then(async wreckedInfo => {
      const cate = disassemblyCategorys[wreckedInfo.disassemblyCategory];
      wreckedInfo.disassemblyNumber = cate + wreckedInfo.id;
      return await this.carWreckedEntity.save(wreckedInfo);
    });
  }

  async handleDisassemble(params: any) {
    const promise = [];
    if (params.dismantlingLabelsData) {
      params.dismantlingLabelsData.forEach(v => {
        if (v.name === 'Other') {
          v.others.forEach(pt => {
            promise.push(
              this.add({
                carID: params.carID,
                disassemblyDescription: pt.value,
                disassemblyCategory: 'Dismantling Labels',
                disassmblingInformation: pt.name,
              })
            );
          });
          return;
        }
        v.parts.forEach(pt => {
          promise.push(
            this.add({
              carID: params.carID,
              disassemblyDescription: pt.description,
              disassemblyCategory: 'Dismantling Labels',
              disassmblingInformation: v.name,
            })
          );
        });
      });
    }
    if (params.extraPartsExtractData) {
      params.extraPartsExtractData.forEach(v => {
        if (v.name === 'Other') {
          v.others.forEach(pt => {
            promise.push(
              this.add({
                carID: params.carID,
                disassemblyDescription: pt.value,
                disassemblyCategory: 'Extra Part Extraction',
                disassmblingInformation: pt.name,
              })
            );
          });
          return;
        }
        v.parts.forEach(pt => {
          promise.push(
            this.add({
              carID: params.carID,
              disassemblyDescription: pt.description,
              disassemblyCategory: 'Extra Part Extraction',
              disassmblingInformation: v.name,
            })
          );
        });
      });
    }
    if (params.activeCarForm?.catalyticConverters?.length > 0) {
      const ccs = params.activeCarForm.catalyticConverters;
      ccs.forEach(item => {
        promise.push(
          this.add({
            carID: params.carID,
            disassemblyCategory: 'Catalytic Converter',
            disassmblingInformation: item.catalyticConverterPhotos,
            catalyticConverterName: item.catalyticConverterName,
            catalyticConverterNumber: item.catalyticConverterNumber,
            catType: item.catType,
            locationOfCat: item.locationOfCat,
          })
        );
      });
    }
    return await Promise.all(promise);
  }

  async getWreckedNumber(catalyticConverterNumber) {
    return this.carWreckedEntity.find({
      catalyticConverterNumber,
    });
  }

  // 将零件从集装箱中移除
  async moveOutFromContainer(id: number, containerNumber: string) {
    await this.carWreckedEntity.save({
      id,
      containerID: null,
    });
    const containerItem = await this.containerEntity.findOne({
      containerNumber,
    });
    const containerPartsList = await this.carWreckedEntity.find({
      containerID: containerItem.id,
    });

    if (containerPartsList.length <= 0) {
      const containerItem = await this.containerEntity.findOne({
        containerNumber,
      });
      if (!containerItem) return;
      containerItem.status = 0;
      this.containerEntity.save(containerItem);
    }
  }

  // 将零件添加到集装箱中
  async putToContainer(partId: number, containerNumber: string) {
    const containerItem = await this.containerEntity.findOne({
      containerNumber,
    });
    if (!containerItem) return;

    await this.carWreckedEntity.save({
      id: partId,
      containerID: containerItem.id,
    });

    if (containerItem.status === 0) {
      containerItem.status = 1;
      this.containerEntity.save(containerItem);
    }
  }

  async toGetMaxPaid(body) {
    const maxPaidRecord = await this.carWreckedEntity
      .createQueryBuilder('car_wrecked')
      .select('MAX(car_wrecked.paid)', 'maxPaid')
      .where('car_wrecked.carID = :carID', { carID: body.carID })
      .andWhere('car_wrecked.disassemblyNumber = :disassemblyNumber', {
        disassemblyNumber: body.disassemblyNumber,
      })
      .andWhere('car_wrecked.disassemblyCategory = :disassemblyCategory', {
        disassemblyCategory: body.disassemblyCategory,
      })
      .andWhere('car_wrecked.containerID = :containerID', {
        containerID: body.containerID,
      })
      // .andWhere('car_wrecked.containerNumber = :containerNumber', {
      //   containerNumber: body.containerNumber,
      // })
      .andWhere('car_wrecked.collected = :collected', {
        collected: body.collected,
      })
      .getRawOne();
    console.log(maxPaidRecord, '**********************************');
  }

  //通过id 或 partId查询
  async infoByDn(partId: string) {
    return await this.carWreckedEntity
      .findOne({
        disassemblyNumber: partId,
      })
      .then(async (res: any) => {
        if (res.containerID !== null) {
          let containerInfo = await this.containerEntity.findOne({
            id: res.containerID,
          });
          res.containerStatus = containerInfo?.status;
          res.containerNumber = containerInfo?.containerNumber;
        }

        return res;
      });
  }

  async handleToGetCarWreckedTotal(filters: { [key: string]: any }) {
    const {
      isSold,
      isPaid,
      collected,
      isDeposit,
      containerNumber,
      noSold,
      noPaid,
      noDeposit,
      lowestSoldPrice,
      highestSoldPrice,
      keyWord,
      disassmblingInformation,
    } = filters;
    console.log(filters);
    let total = {
      sold: 0,
      collected: 0,
      paid: 0,
      deposit: 0,
    };

    const query = await this.carWreckedEntity
      .createQueryBuilder('a')
      .leftJoinAndSelect(ContainerEntity, 'b', 'a.containerID = b.id')
      .select(['a.*', 'b.containerNumber']);

    if (containerNumber) {
      query.andWhere('b.containerNumber IN (:containerNumber)', {
        containerNumber: containerNumber,
      });
    }

    if (isSold) {
      query.andWhere('a.sold IS NOT NULL AND a.sold > 0');
    }

    if (collected) {
      query.andWhere('a.collected = :collected', { collected: true });
    }

    if (isPaid) {
      query.andWhere('a.paid IS NOT NULL AND a.paid > 0');
    }

    if (isDeposit) {
      query.andWhere('a.deposit IS NOT NULL AND a.deposit > 0');
    }
    if (noSold) {
      query.andWhere('(a.sold IS NULL OR a.sold = 0)');
    }

    if (noPaid) {
      query.andWhere('(a.paid IS NULL OR a.paid = 0)');
    }

    if (noDeposit) {
      query.andWhere('(a.deposit IS NULL OR a.deposit = 0)');
    }

    if (disassmblingInformation) {
      query.andWhere('(a.disassmblingInformation = :disassmblingInformation)', {
        disassmblingInformation,
      });
    }

    const hightSql = 'a.sold = (select MAX(sold) from `cool-admin`.car_wrecked';
    const lowestSql =
      'a.sold = (select MIN(sold) from `cool-admin`.car_wrecked';
    const sqlArr = [];
    if (containerNumber) {
      sqlArr.push('b.containerNumber = :containerNumber');
    }
    if (keyWord) {
      sqlArr.push(
        '(a.carID LIKE :keyWord OR a.disassemblyNumber LIKE :keyWord OR a.disassmblingInformation LIKE :keyWord OR a.disassemblyDescription LIKE :keyWord)'
      );
    }
    let hightSqlSearch =
      hightSql +
      (sqlArr.length > 0 ? ' where ' : '') +
      sqlArr.join(' and ') +
      ')';
    let lowestSqlSearch =
      lowestSql +
      (sqlArr.length > 0 ? ' where ' : '') +
      sqlArr.join(' and ') +
      ')';
    if (lowestSoldPrice) {
      query.andWhere(lowestSqlSearch);
    }

    if (highestSoldPrice) {
      query.andWhere(hightSqlSearch);
    }

    if (keyWord) {
      query.andWhere(
        '(a.carID LIKE :keyWord OR a.disassemblyNumber LIKE :keyWord OR a.disassmblingInformation LIKE :keyWord OR a.disassemblyDescription LIKE :keyWord)'
      );
    }

    query.setParameter('containerNumber', containerNumber);
    query.setParameter('keyWord', `%${keyWord}%`);

    const results = await query.getRawMany();

    results.forEach(result => {
      total.sold += Number(result.sold) || 0;
      total.collected += result.collected ? 1 : 0;
      total.paid += Number(result.paid) || 0;
      total.deposit += Number(result.deposit) || 0;
    });

    return total;
  }

  async updateAndInsertLog(
    params: {
      id: number;
      type: 'sold' | 'paid' | 'deposit' | 'collected';
      isCollected?: number;
    } & {
      [key in 'sold' | 'paid' | 'deposit']: number;
    }
  ) {
    const info = await this.carWreckedEntity.findOne({ id: params.id });
    if (info) {
      const promise = [];
      let previousValue = info[params.type];
      let uid = this.ctx.admin?.userId;
      if (params.type === 'collected') {
        if (params.isCollected !== null) {
          info.collected = params.isCollected;
          if (info.collected === 0) {
            info.sold = null;
            info.paid = null;
            info.deposit = null;
            info.buyerID = null;
          }
        }
      } else {
        info[params.type] = params[params.type];
      }
      // info[params.type] = params.type === 'collected' && params.isCollected !== null ? params.isCollected : params[params.type];
      const transactionsInfo = await this.partTransactionsEntity.findOne({
        carWreckedID: params.id,
        status: 0,
      });
      if (transactionsInfo) {
        if (params.type !== 'collected') {
          transactionsInfo[`${params.type}Price`] = info[params.type];
          transactionsInfo[`${params.type}Date`] = new Date();
        } else {
          if (params.isCollected === 1) {
            transactionsInfo.collectedDate = new Date();
          } else {
            transactionsInfo.status = 1;
            transactionsInfo.canceledDate = new Date();
          }
        }
        promise.push(this.partTransactionsEntity.save(transactionsInfo));
      } else {
        const containerItem = await this.containerEntity.findOne({
          id: info.containerID,
        });
        if (params.type !== 'collected') {
          promise.push(
            this.partTransactionsEntity.save({
              carWreckedID: params.id,
              billNo: `${info.disassemblyNumber}${
                containerItem ? ' ' + containerItem.containerNumber : ''
              }`,
              [`${params.type}Price`]: info[params.type],
              [`${params.type}Date`]: new Date(),
              status: 0,
            })
          );
        } else {
          promise.push(
            this.partTransactionsEntity.save({
              carWreckedID: params.id,
              collectedDate: new Date(),
              billNo: `${info.disassemblyNumber}${
                containerItem ? ' ' + containerItem.containerNumber : ''
              }`,
              status: 0,
            })
          );
        }
      }
      promise.push(this.carWreckedEntity.save(info));
      promise.push(
        await this.partLogEntity.save({
          previousValue,
          carWreckedID: params.id,
          currentValue: params[params.type] ?? 0,
          changeType: params.type,
          changedBy: uid,
        })
      );
      try {
        await Promise.all(promise);
        return info;
      } catch (e) {
        console.log(e);
      }
    } else {
      throw new Error('ID does not exist');
    }
  }

  async getCarWreckedWidthTransaction(id) {
    let carWreckedInfo;
    let partTransactionInfo;
    const promise = [];
    try {
      promise.push(
        this.carWreckedEntity.findOne({ id }).then(res => {
          carWreckedInfo = res;
        })
      );
      promise.push(
        this.partTransactionsEntity
          .findOne({ carWreckedID: id, status: 0 })
          .then(res => (partTransactionInfo = res))
      );
      await Promise.all(promise);

      return {
        ...carWreckedInfo,
        collectedDate: partTransactionInfo?.collectedDate,
        paidDate: partTransactionInfo?.paidDate,
        soldDate: partTransactionInfo?.soldDate,
        depositDate: partTransactionInfo?.depositDate,
        part_transaction_id: partTransactionInfo?.id,
      };
    } catch (e) {
      return null;
    }
  }
}

const disassemblyCategorys = {
  'Dismantling Labels': 'DL',
  'Extra Part Extraction': 'EPE',
  'Catalytic Converter': 'CC',
};
@Provide()
export class CarBaseService extends BaseService {
  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;

  @InjectEntityModel(OrderInfoEntity)
  orderInfoEntity: Repository<OrderInfoEntity>;

  @InjectEntityModel(CarPartsEntity)
  carPartsEntity: Repository<CarPartsEntity>;

  async getOneCarInfo(id: number) {
    return await this.carEntity.findOne({ id });
  }

  async getOneCarOrderInfo(id: number) {
    return await this.orderInfoEntity.findOne({ carID: id });
  }

  // async getNumber(catalyticConverterNumber) {
  //   // carWreckedInfo catalyticConverterNumber
  //   const sql = `SELECT * FROM \`car\`
  //   WHERE carWreckedInfo->'$.catalyticConverterNumber' = '${catalyticConverterNumber}';`;
  //   const sqlSearch = await this.nativeQuery(sql);
  //   return sqlSearch;
  // }

  async getNumber(catalyticConverterNumber) {
    // 使用参数化查询来防止SQL注入
    const sql = `SELECT * FROM car
    WHERE JSON_CONTAINS(carWreckedInfo->'$.infos.activeCarForm.catalyticConverters', 
    JSON_OBJECT('catalyticConverterNumber', ?), 
    '$')`;

    // 使用参数化查询的方法执行SQL
    const sqlSearch = await this.carEntity.query(sql, [
      catalyticConverterNumber,
    ]);
    return sqlSearch;
  }

  async changeCarStatus(status: number, id: number) {
    return await this.carEntity.update(
      {
        id,
      },
      {
        status,
      }
    );
  }

  async getCarInfoWidthOrder(id: number) {
    let carInfo;
    let orderInfo;
    const promise = [];
    try {
      promise.push(
        this.carEntity.findOne({ id }).then(res => {
          carInfo = res;
        })
      );
      promise.push(
        this.orderInfoEntity
          .findOne({ carID: id })
          .then(res => (orderInfo = res))
      );
      await Promise.all(promise);

      return {
        ...carInfo,
        imageFileDir: orderInfo.imageFileDir,
        createBy: orderInfo.createBy,
        createTime: orderInfo.createTime,
        expectedDate: orderInfo.expectedDate,
      };
    } catch (e) {
      return null;
    }
  }

  async updateCarDismantlingStatus(id: number, status: string) {
    await this.carEntity.update({ id }, { dismantlingStatus: status });
  }

  async carsPartsStats(departmentId) {
    const carCount = {
      forRecyclingCars: {
        total: null,
        disassembled: null,
        parts: {
          total: null,
          dismentaled: null,
        },
      },
      forPartsCars: {
        total: null,
        disassembled: null,
        parts: {
          total: null,
          dismentaled: null,
        },
      },
      allCars: {
        total: null,
        disassembled: null,
        parts: {
          total: null,
          dismentaled: null,
        },
      },
    };
    const promise = [];
    // carCount.allCars
    promise.push(
      await this.carEntity
        .createQueryBuilder('car')
        .innerJoin('order', 'order', 'car.id = order.carID')
        .innerJoin('job', 'job', 'job.orderID = order.id')
        .andWhere('car.departmentId = :departmentId', { departmentId })
        .andWhere('job.status = :status', { status: 4 })
        .getCount()
        .then(c => {
          carCount.allCars.total = c;
        })
    );
    promise.push(
      await this.carEntity
        .createQueryBuilder('car')
        .innerJoin('order', 'order', 'car.id = order.carID')
        .innerJoin('job', 'job', 'job.orderID = order.id')
        .andWhere('car.departmentId = :departmentId', { departmentId })
        .andWhere('car.dismantlingStatus = :dismantlingStatus', {
          dismantlingStatus: 'disassembled',
        })
        .andWhere('job.status = :status', { status: 4 })
        .getCount()
        .then(c => {
          carCount.allCars.disassembled = c;
        })
    );
    promise.push(
      await this.carPartsEntity
        .createQueryBuilder('carParts')
        .innerJoin('car', 'car', 'carParts.carID = car.id')
        .innerJoin('order', 'order', 'car.id = order.carID')
        .innerJoin('job', 'job', 'job.orderID = order.id')
        .andWhere('car.departmentId = :departmentId', { departmentId })
        .andWhere('job.status = :jobStatus', { jobStatus: 4 })
        .getCount()
        .then(c => {
          carCount.allCars.parts.total = c;
        })
    );
    promise.push(
      await this.carPartsEntity
        .createQueryBuilder('carParts')
        .innerJoin('car', 'car', 'carParts.carID = car.id')
        .innerJoin('order', 'order', 'car.id = order.carID')
        .innerJoin('job', 'job', 'job.orderID = order.id')
        .andWhere('carParts.status = :carPartsStatus', { carPartsStatus: 1 }) // 添加 carParts 的 status 条件
        .andWhere('car.departmentId = :departmentId', { departmentId })
        .andWhere('job.status = :jobStatus', { jobStatus: 4 })
        .getCount()
        .then(c => {
          carCount.allCars.parts.dismentaled = c;
        })
    );

    // carCount.forRecyclingCars
    promise.push(
      await this.carEntity
        .createQueryBuilder('car')
        .innerJoin('order', 'order', 'car.id = order.carID')
        .innerJoin('job', 'job', 'job.orderID = order.id')
        .andWhere('car.departmentId = :departmentId', { departmentId })
        .andWhere('car.recyclingStatus = :recyclingStatus', {
          recyclingStatus: 'for recycling',
        })
        .andWhere('job.status = :status', { status: 4 })
        .getCount()
        .then(c => {
          carCount.forRecyclingCars.total = c;
        })
    );
    promise.push(
      await this.carEntity
        .createQueryBuilder('car')
        .innerJoin('order', 'order', 'car.id = order.carID')
        .innerJoin('job', 'job', 'job.orderID = order.id')
        .andWhere('car.departmentId = :departmentId', { departmentId })
        .andWhere('car.recyclingStatus = :recyclingStatus', {
          recyclingStatus: 'for recycling',
        })
        .andWhere('car.dismantlingStatus = :dismantlingStatus', {
          dismantlingStatus: 'disassembled',
        })
        .andWhere('job.status = :status', { status: 4 })
        .getCount()
        .then(c => {
          carCount.forRecyclingCars.disassembled = c;
        })
    );
    promise.push(
      await this.carPartsEntity
        .createQueryBuilder('carParts')
        .innerJoin('car', 'car', 'carParts.carID = car.id')
        .innerJoin('order', 'order', 'car.id = order.carID')
        .innerJoin('job', 'job', 'job.orderID = order.id')
        .andWhere('car.departmentId = :departmentId', { departmentId })
        .andWhere('car.recyclingStatus = :recyclingStatus', {
          recyclingStatus: 'for recycling',
        })
        .andWhere('job.status = :jobStatus', { jobStatus: 4 })
        .getCount()
        .then(c => {
          carCount.forRecyclingCars.parts.total = c;
        })
    );
    promise.push(
      await this.carPartsEntity
        .createQueryBuilder('carParts')
        .innerJoin('car', 'car', 'carParts.carID = car.id')
        .innerJoin('order', 'order', 'car.id = order.carID')
        .innerJoin('job', 'job', 'job.orderID = order.id')
        .andWhere('carParts.status = :carPartsStatus', { carPartsStatus: 1 }) // 添加 carParts 的 status 条件
        .andWhere('car.departmentId = :departmentId', { departmentId })
        .andWhere('car.recyclingStatus = :recyclingStatus', {
          recyclingStatus: 'for recycling',
        })
        .andWhere('job.status = :jobStatus', { jobStatus: 4 })
        .getCount()
        .then(c => {
          carCount.forRecyclingCars.parts.dismentaled = c;
        })
    );

    // carCount.forPartsCars
    promise.push(
      await this.carEntity
        .createQueryBuilder('car')
        .innerJoin('order', 'order', 'car.id = order.carID')
        .innerJoin('job', 'job', 'job.orderID = order.id')
        .andWhere('car.departmentId = :departmentId', { departmentId })
        .andWhere('car.recyclingStatus = :recyclingStatus', {
          recyclingStatus: 'for parts',
        })
        .andWhere('job.status = :status', { status: 4 })
        .getCount()
        .then(c => {
          carCount.forPartsCars.total = c;
        })
    );
    promise.push(
      await this.carEntity
        .createQueryBuilder('car')
        .innerJoin('order', 'order', 'car.id = order.carID')
        .innerJoin('job', 'job', 'job.orderID = order.id')
        .andWhere('car.departmentId = :departmentId', { departmentId })
        .andWhere('car.recyclingStatus = :recyclingStatus', {
          recyclingStatus: 'for parts',
        })
        .andWhere('car.dismantlingStatus = :dismantlingStatus', {
          dismantlingStatus: 'disassembled',
        })
        .andWhere('job.status = :status', { status: 4 })
        .getCount()
        .then(c => {
          carCount.forPartsCars.disassembled = c;
        })
    );
    promise.push(
      await this.carPartsEntity
        .createQueryBuilder('carParts')
        .innerJoin('car', 'car', 'carParts.carID = car.id')
        .innerJoin('order', 'order', 'car.id = order.carID')
        .innerJoin('job', 'job', 'job.orderID = order.id')
        .andWhere('car.departmentId = :departmentId', { departmentId })
        .andWhere('car.recyclingStatus = :recyclingStatus', {
          recyclingStatus: 'for parts',
        })
        .andWhere('job.status = :jobStatus', { jobStatus: 4 })
        .getCount()
        .then(c => {
          carCount.forPartsCars.parts.total = c;
        })
    );
    promise.push(
      await this.carPartsEntity
        .createQueryBuilder('carParts')
        .innerJoin('car', 'car', 'carParts.carID = car.id')
        .innerJoin('order', 'order', 'car.id = order.carID')
        .innerJoin('job', 'job', 'job.orderID = order.id')
        .andWhere('carParts.status = :carPartsStatus', { carPartsStatus: 1 }) // 添加 carParts 的 status 条件
        .andWhere('car.departmentId = :departmentId', { departmentId })
        .andWhere('car.recyclingStatus = :recyclingStatus', {
          recyclingStatus: 'for parts',
        })
        .andWhere('job.status = :jobStatus', { jobStatus: 4 })
        .getCount()
        .then(c => {
          carCount.forPartsCars.parts.dismentaled = c;
        })
    );

    await Promise.all(promise);
    return carCount;
  }
}

/**
 * car parts
 */
@Provide()
export class CarPartsService extends BaseService {
  @InjectEntityModel(CarPartsEntity)
  carPartsEntity: Repository<CarPartsEntity>;

  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;

  @InjectEntityModel(ContainerEntity)
  containerEntity: Repository<ContainerEntity>;

  @Inject()
  ctx;

  @InjectEntityModel(PartTransactionsEntity)
  partTransactionsEntity: Repository<PartTransactionsEntity>;

  @InjectEntityModel(PartLogEntity)
  partLogEntity: Repository<PartLogEntity>;

  /**
   * 新增
   * @param param
   */
  async add(params) {
    return this.carPartsEntity.save(params).then(async partDetail => {
      const cate = 'EPE';
      partDetail.disassemblyNumber = cate + partDetail.id;
      // this.partTransactionsEntity.save({
      //   carWreckedID: partDetail.id,
      //   billNo: `${partDetail.disassemblyNumber}`,
      //   status: 0,
      // });
      return await this.carPartsEntity.save(partDetail);
    });
  }

  /**
   * 描述
   */
  async addParts(params: any) {
    const promise = [];
    if (params.parts?.length > 0) {
      params.parts.forEach(v => {
        if (v.name === 'Other') {
          v.others.forEach(pt => {
            promise.push(
              this.add({
                carID: params.carID,
                disassemblyDescription: pt.value,
                disassmblingInformation: pt.name,
                color: v.color,
              })
            );
          });
          return;
        }
        v.parts.forEach(pt => {
          promise.push(
            this.add({
              carID: params.carID,
              disassemblyDescription: pt.description,
              disassmblingInformation: v.name,
              color: v.color,
            })
          );
        });
      });
    }
    return await Promise.all(promise);
  }

  async gerPartsWidthIds(carIds: number[]) {
    return this.carPartsEntity.find({
      where: {
        carID: In(carIds),
      },
    });
  }

  // 将零件从集装箱中移除
  async moveOutFromContainer(id: number, containerNumber: string) {
    await this.carPartsEntity.save({
      id,
      containerID: null,
    });
    const containerItem = await this.containerEntity.findOne({
      containerNumber,
    });
    const containerPartsList = await this.carPartsEntity.find({
      containerID: containerItem.id,
    });

    if (containerPartsList.length <= 0) {
      const containerItem = await this.containerEntity.findOne({
        containerNumber,
      });
      if (!containerItem) return;
      containerItem.status = 0;
      this.containerEntity.save(containerItem);
    }
  }

  async updateAndInsertLog(
    params: {
      id: number;
      type: 'sold' | 'paid' | 'deposit' | 'collected';
      isCollected?: number;
    } & {
      [key in 'sold' | 'paid' | 'deposit']: number;
    }
  ) {
    const info = await this.carPartsEntity.findOne({ id: params.id });
    if (info) {
      const promise = [];
      let previousValue = info[params.type];
      let uid = this.ctx.admin?.userId;
      // if (params.type === 'collected') {
      //   if (params.isCollected !== null) {
      //     info.collected = params.isCollected;
      //     if (info.collected === 0) {
      //       info.sold = null;
      //       info.paid = null;
      //       info.deposit = null;
      //       info.buyerID = null;
      //     }
      //   }
      // } else {
      //   info[params.type] = params[params.type];
      // }
      // info[params.type] = params.type === 'collected' && params.isCollected !== null ? params.isCollected : params[params.type];
      const transactionsInfo = await this.partTransactionsEntity.findOne({
        carWreckedID: params.id,
        status: 0,
      });
      if (transactionsInfo) {
        if (params.type !== 'collected') {
          transactionsInfo[`${params.type}Price`] = Number(params[params.type]);
          transactionsInfo[`${params.type}Date`] = new Date();
        } else {
          if (params.isCollected === 1) {
            transactionsInfo.collectedDate = new Date();
            transactionsInfo.collected = 1;
          } else {
            transactionsInfo.status = 1;
            transactionsInfo.canceledDate = new Date();
          }
        }
        promise.push(this.partTransactionsEntity.save(transactionsInfo));
      } else {
        const containerItem = await this.containerEntity.findOne({
          id: info.containerID,
        });
        if (params.type !== 'collected') {
          promise.push(
            this.partTransactionsEntity.save({
              carWreckedID: params.id,
              billNo: `${info.disassemblyNumber}${
                containerItem ? ' ' + containerItem.containerNumber : ''
              }`,
              [`${params.type}Price`]: params[params.type],
              [`${params.type}Date`]: new Date(),
              status: 0,
            })
          );
        } else {
          promise.push(
            this.partTransactionsEntity.save({
              carWreckedID: params.id,
              collectedDate: new Date(),
              collected: params.isCollected,
              billNo: `${info.disassemblyNumber}${
                containerItem ? ' ' + containerItem.containerNumber : ''
              }`,
              status: 0,
            })
          );
        }
      }
      // promise.push(this.carWreckedEntity.save(info));
      promise.push(
        await this.partLogEntity.save({
          previousValue,
          carWreckedID: params.id,
          currentValue: params[params.type] ?? 0,
          changeType: params.type,
          changedBy: uid,
        })
      );
      try {
        const res = await Promise.all(promise);
        return res;
      } catch (e) {
        console.log(e);
      }
    } else {
      throw new Error('ID does not exist');
    }
  }

  async getCarWreckedWidthTransaction(id) {
    let carWreckedInfo;
    let partTransactionInfo;
    const promise = [];
    try {
      promise.push(
        this.carPartsEntity.findOne({ id }).then(res => {
          carWreckedInfo = res;
        })
      );
      promise.push(
        this.partTransactionsEntity
          .findOne({ carWreckedID: id, status: 0 })
          .then(res => (partTransactionInfo = res))
      );
      await Promise.all(promise);

      return {
        collectedDate: partTransactionInfo?.collectedDate,
        paidDate: partTransactionInfo?.paidDate,
        soldDate: partTransactionInfo?.soldDate,
        depositDate: partTransactionInfo?.depositDate,
        part_transaction_id: partTransactionInfo?.id,
        sold: partTransactionInfo?.soldPrice,
        deposit: partTransactionInfo?.depositPrice,
        paid: partTransactionInfo?.paidPrice,
        collected: partTransactionInfo?.collected,
        carWreckedInfo,
      };
    } catch (e) {
      return null;
    }
  }

  async getWreckedInfo(id: number) {
    return await this.carPartsEntity.findOne({ id });
  }

  /**
   * 获取总数统计
   */
  async handleToGetCarWreckedTotal(filters: { [key: string]: any }) {
    const {
      isSold,
      isPaid,
      collected,
      isDeposit,
      containerNumber,
      noSold,
      noPaid,
      noDeposit,
      lowestSoldPrice,
      highestSoldPrice,
      keyWord,
      disassmblingInformation,
    } = filters;
    console.log(filters);
    let total = {
      sold: 0,
      collected: 0,
      paid: 0,
      deposit: 0,
      priceCollected: 0,
    };

    const query = await this.carPartsEntity
      .createQueryBuilder('a')
      .leftJoinAndSelect(ContainerEntity, 'b', 'a.containerID = b.id')
      .leftJoinAndSelect(CarEntity, 'c', 'a.carID = c.id')
      .leftJoinAndSelect(
        PartTransactionsEntity,
        'p',
        'a.id = p.carWreckedID and p.status = 0'
      )
      .select([
        'a.*',
        'b.containerNumber',
        'p.soldPrice',
        'p.depositPrice',
        'p.paidPrice',
        'p.collected',
      ]);

    if (containerNumber) {
      query.andWhere('b.containerNumber IN (:containerNumber)', {
        containerNumber: containerNumber,
      });
    }

    if (isSold) {
      query.andWhere('p.soldPrice IS NOT NULL AND p.soldPrice > 0');
    }

    if (collected) {
      query.andWhere('p.collected = :collected', { collected: true });
    }

    if (isPaid) {
      query.andWhere('p.paidPrice IS NOT NULL AND p.paidPrice > 0');
    }

    if (isDeposit) {
      query.andWhere('p.depositPrice IS NOT NULL AND p.depositPrice > 0');
    }
    if (noSold) {
      query.andWhere('(p.soldPrice IS NULL OR p.soldPrice = 0)');
    }

    if (noPaid) {
      query.andWhere('(p.paidPrice IS NULL OR p.paidPrice = 0)');
    }

    if (noDeposit) {
      query.andWhere('(p.depositPrice IS NULL OR p.depositPrice = 0)');
    }

    if (disassmblingInformation) {
      query.andWhere('(a.disassmblingInformation = :disassmblingInformation)', {
        disassmblingInformation,
      });
    }

    const hightSql =
      'p.soldPrice = (select MAX(soldPrice) from `cool-admin`.part_transactions';
    const lowestSql =
      'p.soldPrice = (select MIN(soldPrice) from `cool-admin`.part_transactions';
    const sqlArr = [];
    if (containerNumber) {
      sqlArr.push('b.containerNumber = :containerNumber');
    }
    // if (keyWord) {
    //   sqlArr.push(
    //     '(a.carID LIKE :keyWord OR a.disassemblyNumber LIKE :keyWord OR a.disassmblingInformation LIKE :keyWord OR a.disassemblyDescription LIKE :keyWord)'
    //   );
    // }
    let hightSqlSearch =
      hightSql +
      (sqlArr.length > 0 ? ' where ' : '') +
      sqlArr.join(' and ') +
      ')';
    let lowestSqlSearch =
      lowestSql +
      (sqlArr.length > 0 ? ' where ' : '') +
      sqlArr.join(' and ') +
      ')';
    if (lowestSoldPrice) {
      query.andWhere(lowestSqlSearch);
    }

    if (highestSoldPrice) {
      query.andWhere(hightSqlSearch);
    }

    if (keyWord) {
      query.andWhere(
        '(a.carID LIKE :keyWord OR a.disassemblyNumber LIKE :keyWord OR a.disassmblingInformation LIKE :keyWord OR a.disassemblyDescription LIKE :keyWord OR c.name LIKE :keyWord OR c.model LIKE :keyWord OR c.year LIKE :keyWord OR c.brand LIKE :keyWord)'
      );
    }

    query.setParameter('containerNumber', containerNumber);
    query.setParameter('keyWord', `%${keyWord}%`);

    const results = await query.getRawMany();

    results.forEach(result => {
      total.sold += Number(result.p_soldPrice) || 0;
      total.collected += result.p_collected ? 1 : 0;
      total.paid += Number(result.p_paidPrice) || 0;
      total.deposit += Number(result.p_depositPrice) || 0;
      if (result.p_collected) {
        total.priceCollected +=
          (Number(result.p_paidPrice) || 0) +
          (Number(result.p_depositPrice) || 0);
      }
    });

    return { ...total, results };
  }

  async carPartsList(carID: number) {
    return await this.carPartsEntity.find({ carID });
  }

  async updatePartsStatus(id: number, status: number) {
    await this.carPartsEntity.update({ id }, { status });
  }

  //通过id 或 partId查询
  async infoByDn(partId: number) {
    return await this.carPartsEntity
      .findOne({
        id: partId,
      })
      .then(async (res: any) => {
        const promise = [];
        if (res?.containerID !== null) {
          promise.push(
            this.containerEntity
              .findOne({
                id: res.containerID,
              })
              .then(c => {
                if (!c) return;
                res.containerStatus = c?.status;
                res.containerNumber = c?.containerNumber;
              })
          );
        }
        if (res?.carID !== null) {
          promise.push(
            this.carEntity
              .findOne({
                id: res.carID,
              })
              .then(c => {
                if (!c) return;
                res.vin = c.vinNumber;
                res.registrationNumber = c.registrationNumber;
                res.year = c.year;
                res.make = c.brand;
                res.model = c.model;
                res.series = c.series;
                res.fuel = c.fuel;
                res.transmission = c.transmission;
                res.cylinders = c.cylinders;
                res.engineNumber = c.engineNumber;
                res.engineCode = c.engineCode;
              })
          );
        }
        await Promise.all(promise);
        return res;
      });
  }

  // 将零件添加到集装箱中
  async putToContainer(partId: number, containerNumber: string) {
    const containerItem = await this.containerEntity.findOne({
      containerNumber,
    });
    if (!containerItem) return;

    await this.carPartsEntity.save({
      id: partId,
      containerID: containerItem.id,
    });

    if (containerItem.status === 0) {
      containerItem.status = 1;
      this.containerEntity.save(containerItem);
    }
  }

  async countPartsInContainer(departmentId: number) {
    const carIds = await this.carEntity.find({
      where: { departmentId: departmentId },
      select: ['id'],
    }).then(cars => cars.map(car => car.id));
  
    const [partsInContainer, totalParts] = await Promise.all([
      this.carPartsEntity.count({
        where: {
          containerID: Not(IsNull()),
          carID: In(carIds),
        },
      }),
      this.carPartsEntity.count({
        where: {
          carID: In(carIds),
        },
      }),
    ]);
  
    return { partsInContainer, totalParts };
  }
}
/**
 * 描述
 */
interface AddLabels {
  name: string;
  parts: {
    description: string;
  }[];
}
@Provide()
export class CarLabelsService extends BaseService {
  @InjectEntityModel(CarLabelsEntity)
  carLabelsEntity: Repository<CarLabelsEntity>;

  /**
   * 描述
   */
  async addLabels(labels: AddLabels[]) {
    const promise = [];
    labels.forEach(label => {
      label.parts.forEach(element => {});
      promise.push(this.carLabelsEntity.save({}));
    });
  }
}

@Provide()
export class CarCatalyticConverterService extends BaseService {
  @InjectEntityModel(CarCatalyticConverterEntity)
  carCatalyticConverterEntity: Repository<CarCatalyticConverterEntity>;

  /**
   * 新增
   * @param param
   */
  async add(params) {
    return this.carCatalyticConverterEntity
      .save(params)
      .then(async partDetail => {
        const cate = 'CC';
        partDetail.disassemblyNumber = cate + partDetail.id;
        return await this.carCatalyticConverterEntity.save(partDetail);
      });
  }

  async getCatalyticConverterWidthIds(carIds: number[]) {
    return this.carCatalyticConverterEntity.find({
      where: {
        carID: In(carIds),
      },
    });
  }

  async geCatInfo(id: number) {
    return this.carCatalyticConverterEntity.findOne({ id });
  }
}
