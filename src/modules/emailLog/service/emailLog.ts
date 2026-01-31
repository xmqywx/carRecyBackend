import { Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { EmailLogEntity } from '../entity/info';

/**
 * 邮件日志服务
 */
@Provide()
export class EmailLogService extends BaseService {
  @InjectEntityModel(EmailLogEntity)
  emailLogEntity: Repository<EmailLogEntity>;

  /**
   * 保存邮件发送日志
   */
  async saveLog(data: {
    orderId: number;
    emailType: 'invoice' | 'proof_request';
    recipients: string[];
    subject: string;
    contentData: object;
    pdfUrl?: string;
    sentBy?: string;
    operatorName?: string;
    status: 'success' | 'failed';
    errorMessage?: string;
  }): Promise<EmailLogEntity> {
    const log = new EmailLogEntity();
    log.orderId = data.orderId;
    log.emailType = data.emailType;
    log.recipients = JSON.stringify(data.recipients);
    log.subject = data.subject;
    log.contentData = JSON.stringify(data.contentData);
    log.pdfUrl = data.pdfUrl || null;
    log.sentBy = data.sentBy || null;
    log.operatorName = data.operatorName || null;
    log.status = data.status;
    log.errorMessage = data.errorMessage || null;

    return await this.emailLogEntity.save(log);
  }

  /**
   * 根据订单ID获取邮件日志
   */
  async getLogsByOrderId(orderId: number): Promise<EmailLogEntity[]> {
    return await this.emailLogEntity.find({
      where: { orderId },
      order: { createTime: 'DESC' },
    });
  }

  /**
   * 获取订单的最后一次发票发送记录
   */
  async getLastInvoiceLog(orderId: number): Promise<EmailLogEntity | undefined> {
    return await this.emailLogEntity.findOne({
      where: { orderId, emailType: 'invoice', status: 'success' },
      order: { createTime: 'DESC' },
    });
  }
}
