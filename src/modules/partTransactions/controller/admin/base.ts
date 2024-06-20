import { Provide, Inject, Post } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { PartTransactionsEntity } from '../../entity/base';
import { BuyerEntity } from '../../../buyer/entity/base';
import { CarEntity } from '../../../car/entity/base';
import { PartTransactionsService } from '../../service/base';
import { ContainerEntity } from '../../../container/entity/base';
import { CarPartsEntity } from '../../../car/entity/carParts';

/**
 * 零件交易
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: PartTransactionsEntity,
  pageQueryOp: {
    select: [
      'a.*',
      'b.disassmblingInformation',
      'b.containerID',
      'e.containerNumber',
      'b.disassemblyNumber',
      'b.disassemblyDescription',
      'buyer.name as buyer_name, buyer.address as buyer_address, buyer.phone as buyer_phone',
      'c.name',
      'b.carID',
      'd.name as collector_name',
      'd.phone as collector_phone',
      'd.address as collector_address',
    ],
    fieldEq: [
      { column: 'a.status', requestParam: 'status' },
      { column: 'b.disassmblingInformation', requestParam: 'partInfo' },
      { column: 'e.containerNumber', requestParam: 'containerNumber' },
    ],
    where: ctx => {
      const { isSold, soldStartDate, soldEndDate } = ctx.request.body;

      return [
        isSold ? ['a.soldPrice IS NOT NULL AND a.soldPrice > 0', {}] : [],
        soldStartDate
          ? ['a.soldDate >= :soldStartDate', { soldStartDate: soldStartDate }]
          : [],
        soldEndDate
          ? ['a.soldDate <= :soldEndDate', { soldEndDate: soldEndDate }]
          : [],
      ];
    },
    join: [
      {
        entity: CarPartsEntity,
        alias: 'b',
        condition: 'a.carWreckedID = b.id',
        type: 'leftJoin',
      },
      {
        entity: BuyerEntity,
        alias: 'buyer',
        condition: 'buyer.id = a.buyerID',
        type: 'leftJoin',
      },
      {
        entity: CarEntity,
        alias: 'c',
        condition: 'b.carID = c.id',
        type: 'leftJoin',
      },
      {
        entity: BuyerEntity,
        alias: 'd',
        condition: 'a.collectorID = d.id',
        type: 'leftJoin',
      },
      {
        entity: ContainerEntity,
        alias: 'e',
        condition: 'b.containerID = e.id',
        type: 'leftJoin',
      },
    ],
  },
})
export class PartTransactionsController extends BaseController {
  @Inject()
  partTransactionsService: PartTransactionsService;

  @Post('/getPartInfoFilterOpts')
  async getPartInfoFilterOpts() {
    try {
      const opts = await this.partTransactionsService.getPartInfoFilterOpts();
      return this.ok(opts);
    } catch (e) {
      return this.fail(e);
    }
  }
}
