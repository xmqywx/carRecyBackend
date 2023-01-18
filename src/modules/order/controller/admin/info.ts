import {Provide} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import {Repository} from "typeorm";
import {InjectEntityModel} from "@midwayjs/orm";
import {OrderInfoEntity} from "../../entity/info";
import {CustomerProfileEntity} from "../../../customer/entity/profile";
import {CarEntity} from "../../../car/entity/base";
import {OrderActionEntity} from "../../entity/action";

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: OrderInfoEntity,

  pageQueryOp: {
    keyWordLikeFields: ['customerID'],
    select: ['a.*', 'b.firstName', 'b.surname', 'b.phoneNumber', 'b.emailAddress',  'b.address', 'c.model', 'c.year', 'c.brand', 'c.colour', 'c.vinNumber'],
    // 多表关联，请求筛选字段与表字段不一致的情况
    fieldEq: [{ column: 'a.createTime', requestParam: 'createTime' }],
    join: [{
      entity: CustomerProfileEntity,
      alias: 'b',
      condition: 'a.customerID = b.id',
      type: 'leftJoin'
    }, {
      entity: CarEntity,
      alias: 'c',
      condition: 'a.carID = c.id',
      type: 'leftJoin'
    }]
  },
})
export class VehicleProfileController extends BaseController {
  @InjectEntityModel(OrderInfoEntity)
  orderInfoEntity: Repository<OrderInfoEntity>;
  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;
  @InjectEntityModel(OrderActionEntity)
  orderActionEntity: Repository<OrderActionEntity>;
}
