import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { PartTransactionsEntity } from '../entity/base';
import { CarWreckedEntity } from '../../car/entity/carWrecked';

@Provide()
export class PartTransactionsService extends BaseService {
  @InjectEntityModel(PartTransactionsEntity)
  partTransactionsEntity: Repository<PartTransactionsEntity>;

  async getPartInfoFilterOpts() {
    const results = await this.partTransactionsEntity
      .createQueryBuilder('part_transactions')
      .leftJoinAndSelect(
        CarWreckedEntity,
        'car_wrecked',
        'part_transactions.carWreckedID = car_wrecked.id'
      )
      .select([
        'part_transactions.*',
        'car_wrecked.disassmblingInformation',
        'car_wrecked.containerNumber',
      ])
      .where('part_transactions.status = 0')
      .getRawMany();
    const opts = {
      partInfo: [],
      containerNumber: [],
    };

    opts.partInfo = Array.from(
      new Set(
        results.map((result: any) => result.car_wrecked_disassmblingInformation)
      )
    );
    opts.containerNumber = Array.from(
      new Set(results.map((result: any) => result.car_wrecked_containerNumber))
    );

    return opts;
  }
}
