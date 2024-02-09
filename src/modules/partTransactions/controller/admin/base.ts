import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { PartTransactionsEntity } from '../../entity/base';
import { CarWreckedEntity } from '../../../car/entity/carWrecked';
import { BuyerEntity } from '../../../buyer/entity/base';
import { CarEntity } from '../../../car/entity/base';
/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: PartTransactionsEntity,
  pageQueryOp: {
    select: ['a.*','b.disassmblingInformation', 'b.containerNumber', 'b.disassemblyNumber', 'b.disassemblyDescription', 'buyer.name as buyer_name, buyer.address as buyer_address, buyer.phone as buyer_phone', 'c.name', 'b.carID'],
    fieldEq: [
      { column: 'a.status', requestParam: 'status' },
    ],
    where: (ctx) => {
      const { isSold, soldStartDate, soldEndDate } = ctx.request.body;

      return [
        isSold ? ['a.soldPrice IS NOT NULL AND a.soldPrice > 0', {}]:[],
        soldStartDate ? ['a.soldDate >= :soldStartDate', {soldStartDate: soldStartDate}] : [],
        soldEndDate ? ['a.soldDate <= :soldEndDate', {soldEndDate: soldEndDate}]:[],
      ]
    },
    join: [
      {
        entity: CarWreckedEntity,
        alias: 'b',
        condition: 'a.carWreckedID = b.id',
        type: 'leftJoin'
      },
      {
        entity: BuyerEntity,
        alias: 'buyer',
        condition: 'buyer.id = a.buyerID',
        type: 'leftJoin'
      },
      {
        entity: CarEntity,
        alias: 'c',
        condition: 'b.carID = c.id',
        type: 'leftJoin'
      }
    ]
  },
})
export class PartTransactionsController extends BaseController {}
