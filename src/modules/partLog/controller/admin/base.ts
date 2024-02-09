import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { PartLogEntity } from '../../entity/base';
import { CarWreckedEntity } from '../../../car/entity/carWrecked';
import { BuyerEntity } from '../../../buyer/entity/base';
/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: PartLogEntity,
  pageQueryOp: {
    select: ['a.*', 'b.containerNumber','b.disassmblingInformation','b.disassemblyNumber', 'b.disassemblyImages','b.disassemblyCategory', 'b.buyerID', 'c.name as buyer_name', 'c.phone as buyer_phone', 'c.address as buyer_address'],
    fieldEq: [],
    join: [
      {
        entity: CarWreckedEntity,
        alias: 'b',
        condition: 'a.carWreckedID = b.id',
        type: 'leftJoin'
      },
      {
        entity: BuyerEntity,
        alias: 'c',
        condition: 'b.buyerID = c.id'
      }
    ]
  },
})
export class PartLogController extends BaseController {}
