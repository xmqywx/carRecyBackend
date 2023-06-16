import {Provide,Body, Post, Inject} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import {Repository} from "typeorm";
import {InjectEntityModel} from "@midwayjs/orm";
import {BaseSysUserEntity} from "../../../base/entity/sys/user";
import {OrderActionEntity} from "../../entity/action";
import {OrderInfoEntity} from "../../entity/info";
import main from '../../../sendEmail';
import {OrderService, OrderActionService} from '../../service/order';


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
  service: OrderActionService
})
export class OrderActionController extends BaseController {
  @InjectEntityModel(OrderActionEntity)
  orderInfoEntity: Repository<OrderActionEntity>

  @Inject()
  orderService: OrderService;

  @Post('/sendEmail')
  async sendEmail(@Body('name') name: string, @Body('id') id: string, @Body('email') email: string, @Body('price') price: number ) {
    const invoicePdf = await this.orderService.getInvoice(id);
    // return this.ok({invoicePdf});
    const info = await main({name, id, price, email, invoicePdf});
    console.log(info);
    if(info.status === 'success') {
      if(!invoicePdf) {
        const saveInvoice = await this.orderService.saveInvoice(id, info.invoicePdf);
        return this.ok({...info, saveInvoice});
      }
    }
    return this.ok({...info});
  }
}
