import { EntityModel } from '@midwayjs/orm';
import { BaseEntity } from '@cool-midway/core';
import { Column } from 'typeorm';

/**
 * 邮件发送日志
 */
@EntityModel('email_log')
export class EmailLogEntity extends BaseEntity {
  @Column({ comment: '关联订单ID', type: 'int' })
  orderId: number;

  @Column({ comment: '邮件类型: invoice/proof_request', length: 50 })
  emailType: string;

  @Column({ comment: '收件人列表JSON', type: 'text' })
  recipients: string;

  @Column({ comment: '邮件主题', length: 255, nullable: true })
  subject: string;

  @Column({ comment: '邮件关键内容JSON', type: 'text', nullable: true })
  contentData: string;

  @Column({ comment: 'PDF文件URL', length: 500, nullable: true })
  pdfUrl: string;

  @Column({ comment: '发送人(自定义显示名)', length: 100, nullable: true })
  sentBy: string;

  @Column({ comment: '操作者用户名', length: 100, nullable: true })
  operatorName: string;

  @Column({ comment: '发送状态: success/failed', length: 20, default: 'success' })
  status: string;

  @Column({ comment: '错误信息', length: 500, nullable: true })
  errorMessage: string;
}
