import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { PartTransactionsEntity } from '../../entity/base';
import { CarWreckedEntity } from '../../../car/entity/carWrecked';
import { BuyerEntity } from '../../../buyer/entity/base';
/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: PartTransactionsEntity,
  pageQueryOp: {
    select: ['a.*, b.disassmblingInformation, b.containerNumber, b.disassemblyNumber, b.disassemblyDescription, buyer.name as buyer_name, buyer.address as buyer_address, buyer.phone as buyer_phone'],
    fieldEq: [
      { column: 'a.status', requestParam: 'status' },
    ],
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
        condition: 'buyer.id = b.buyerID',
        type: 'leftJoin'
      },
    ]
  },
})
export class PartTransactionsController extends BaseController {}
