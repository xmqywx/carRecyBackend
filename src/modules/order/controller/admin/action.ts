import {Provide} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import {Repository} from "typeorm";
import {InjectEntityModel} from "@midwayjs/orm";
import {BaseSysUserEntity} from "../../../base/entity/sys/user";
import {OrderActionEntity} from "../../entity/action";
import {OrderInfoEntity} from "../../entity/info";

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list'],
  entity: OrderActionEntity,

  listQueryOp: {
    select: ['a.*', 'b.username'],
    // 多表关联，请求筛选字段与表字段不一致的情况
    fieldEq: [{ column: 'a.orderID', requestParam: 'orderID' }],
    join: [{
      entity: BaseSysUserEntity,
      alias: 'b',
      condition: 'a.authorID = b.id',
      type: 'leftJoin'
    }, {
      entity: OrderInfoEntity,
      alias: 'c',
      condition: 'a.orderID = c.id',
      type: 'leftJoin'
    }]
  },
})
export class OrderActionController extends BaseController {
  @InjectEntityModel(OrderActionEntity)
  orderInfoEntity: Repository<OrderActionEntity>
}
