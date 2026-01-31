import { Provide, Body, Post, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/orm';
import { BaseSysUserEntity } from '../../../base/entity/sys/user';
import { OrderActionEntity } from '../../entity/action';
import { OrderInfoEntity } from '../../entity/info';
import main from '../../../sendEmail';
import { OrderService, OrderActionService } from '../../service/order';
import { EmailLogService } from '../../../emailLog/service/emailLog';

/**
 * 订单
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list'],
  entity: OrderActionEntity,

  listQueryOp: {
    select: ['a.*', 'b.username'],
    // 多表关联，请求筛选字段与表字段不一致的情况
    fieldEq: [{ column: 'a.orderID', requestParam: 'orderID' }],
    join: [
      {
        entity: BaseSysUserEntity,
        alias: 'b',
        condition: 'a.authorID = b.id',
        type: 'leftJoin',
      },
      {
        entity: OrderInfoEntity,
        alias: 'c',
        condition: 'a.orderID = c.id',
        type: 'leftJoin',
      },
    ],
  },
  service: OrderActionService,
})
export class OrderActionController extends BaseController {
  @InjectEntityModel(OrderActionEntity)
  orderInfoEntity: Repository<OrderActionEntity>;

  @Inject()
  orderService: OrderService;

  @Inject()
  emailLogService: EmailLogService;

  @Post('/sendEmail')
  async sendEmail(
    @Body('name') name: string,
    @Body('id') id: string,
    @Body('email') email: string,
    @Body('price') price: number,
    @Body('operatorName') operatorName?: string
  ) {
    const orderInfo = await this.orderService.getInvoiceInfo(id);
    if (!orderInfo) return this.fail('The job cannot be found.');
    const info = await main({
      name,
      id,
      price,
      email,
      invoicePdf: orderInfo.invoice,
      info: orderInfo,
    });

    // 构建邮件日志的内容数据
    const contentData = {
      invoiceNumber: `#${id.toString().padStart(6, '0')}`,
      customer: {
        name: name || '',
        email: email || '',
      },
      vehicle: {
        rego: orderInfo.registrationNumber || '',
        state: orderInfo.state || '',
        make: orderInfo.brand || '',
        model: orderInfo.model || '',
        year: orderInfo.year || '',
      },
      payment: {
        totalAmount: orderInfo.totalAmount || 0,
        priceExGST: orderInfo.priceExGST || 0,
        gst: orderInfo.gst || 0,
        gstAmount: orderInfo.gstAmount || 0,
      },
    };

    // 保存邮件日志
    try {
      await this.emailLogService.saveLog({
        orderId: parseInt(id),
        emailType: 'invoice',
        recipients: [email],
        subject: 'Invoice from WePickYourCar',
        contentData: contentData,
        pdfUrl: info.invoicePdf || orderInfo.invoice || null,
        sentBy: 'App',
        operatorName: operatorName,
        status: info.status === 'success' ? 'success' : 'failed',
        errorMessage: info.status !== 'success' ? 'Failed to send email' : null,
      });
    } catch (logError) {
      console.error('Failed to save email log:', logError);
      // 日志保存失败不影响主流程
    }

    if (info.status === 'success') {
      if (!orderInfo.invoice) {
        const saveInvoice = await this.orderService.saveInvoice(
          id,
          info.invoicePdf
        );
        return this.ok({ ...info, saveInvoice });
      }
    }
    return this.ok({ ...info });
  }
}
