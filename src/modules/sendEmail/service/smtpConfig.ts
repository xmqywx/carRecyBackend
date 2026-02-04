import { Inject, Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { BaseSysParamEntity } from '../../base/entity/sys/param';
import { CacheManager } from '@midwayjs/cache';

const SMTP_CONFIG_KEY = 'smtp_config';
const EMAIL_TEMPLATE_KEY = 'email_template';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
}

export interface EmailTemplateConfig {
  // 邮件主题
  proofRequestSubject: string;
  invoiceSubject: string;
  // 签名HTML内容（富文本）
  signatureHtml: string;
}

const DEFAULT_SMTP_CONFIG: SmtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  user: '',
  pass: '',
  fromName: 'We Pick Your Car',
  fromEmail: 'noreply@wepickyourcar.com.au',
};

const DEFAULT_EMAIL_TEMPLATE: EmailTemplateConfig = {
  proofRequestSubject: 'Proof materials request from WePickYourCar',
  invoiceSubject: 'Invoice from WePickYourCar',
  signatureHtml: `<p><span style="color: rgb(44, 90, 160);"><strong>Mason</strong></span><br><span style="color: rgb(102, 102, 102);">General Manager</span></p><p><img src="https://apexpoint.com.au/api/public/uploads/20241213/0d016b43-6797-471a-bafc-0d57d5d1efbc_1734063663613.jpg" alt="We Pick Your Car" data-href="" style="width: 150px;height: 78px;"/></p><p><span style="color: rgb(44, 90, 160);"><strong>We Pick Your Car Pty Ltd</strong></span><br><span style="color: rgb(102, 102, 102);">16-18 Tait Street, Smithfield, NSW 2164</span></p><p><a href="mailto:Inquiry@wepickyourcar.com.au" target="">Inquiry@wepickyourcar.com.au</a><br><span style="color: rgb(102, 102, 102);">M: </span><a href="tel:0406007000" target="">0406 007 000</a><span style="color: rgb(102, 102, 102);"> | P: </span><a href="tel:0297572321" target="">(02) 9757 2321</a></p>`,
};

/**
 * SMTP配置服务
 */
@Provide()
export class SmtpConfigService extends BaseService {
  @InjectEntityModel(BaseSysParamEntity)
  baseSysParamEntity: Repository<BaseSysParamEntity>;

  @Inject()
  cacheManager: CacheManager;

  /**
   * 获取SMTP配置
   */
  async getConfig(): Promise<SmtpConfig> {
    // 先从缓存获取
    let cached: any = await this.cacheManager.get(`param:${SMTP_CONFIG_KEY}`);
    if (cached) {
      try {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        if (parsed.data) {
          return JSON.parse(parsed.data);
        }
      } catch (e) {
        console.error('Failed to parse cached SMTP config:', e);
      }
    }

    // 从数据库获取
    const param = await this.baseSysParamEntity.findOne({
      where: { keyName: SMTP_CONFIG_KEY },
    });

    if (param && param.data) {
      try {
        return JSON.parse(param.data);
      } catch (e) {
        console.error('Failed to parse database SMTP config:', e);
      }
    }

    // 返回默认配置
    return DEFAULT_SMTP_CONFIG;
  }

  /**
   * 保存SMTP配置
   */
  async saveConfig(config: SmtpConfig): Promise<boolean> {
    try {
      let param = await this.baseSysParamEntity.findOne({
        where: { keyName: SMTP_CONFIG_KEY },
      });

      const configJson = JSON.stringify(config);

      if (param) {
        // 更新
        param.data = configJson;
        await this.baseSysParamEntity.save(param);
      } else {
        // 新建
        param = new BaseSysParamEntity();
        param.keyName = SMTP_CONFIG_KEY;
        param.name = 'SMTP Email Configuration';
        param.data = configJson;
        param.dataType = 2; // 键值对类型
        param.remark = 'SMTP server configuration for sending emails';
        await this.baseSysParamEntity.save(param);
      }

      // 更新缓存
      await this.cacheManager.set(
        `param:${SMTP_CONFIG_KEY}`,
        JSON.stringify(param)
      );

      return true;
    } catch (e) {
      console.error('Failed to save SMTP config:', e);
      return false;
    }
  }

  /**
   * 测试SMTP连接
   */
  async testConnection(config: SmtpConfig): Promise<{ success: boolean; message: string }> {
    const nodemailer = require('nodemailer');

    try {
      const transport = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass,
        },
        connectionTimeout: 10000,
        socketTimeout: 10000,
      });

      await transport.verify();
      return { success: true, message: 'SMTP connection test successful' };
    } catch (e: any) {
      return { success: false, message: `SMTP connection test failed: ${e.message}` };
    }
  }

  /**
   * 发送测试邮件
   */
  async sendTestEmail(config: SmtpConfig, toEmail: string): Promise<{ success: boolean; message: string }> {
    const nodemailer = require('nodemailer');

    try {
      const transport = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass,
        },
        connectionTimeout: 30000,
        socketTimeout: 30000,
      });

      // 使用登录用户名作为发件地址（大多数SMTP服务器会强制使用登录账号）
      const fromAddress = `"${config.fromName}" <${config.user}>`;

      const info = await transport.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: 'Test Email from We Pick Your Car',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Test Email</h2>
            <p>This is a test email from We Pick Your Car system.</p>
            <p>If you received this email, your SMTP configuration is working correctly.</p>
            <hr />
            <p style="color: #666; font-size: 12px;">
              Sent from: ${fromAddress}<br/>
              SMTP Server: ${config.host}:${config.port}
            </p>
          </div>
        `,
      });

      return { success: true, message: `Test email sent successfully, Message ID: ${info.messageId}` };
    } catch (e: any) {
      return { success: false, message: `Failed to send test email: ${e.message}` };
    }
  }

  /**
   * 获取邮件模板配置
   */
  async getEmailTemplate(): Promise<EmailTemplateConfig> {
    // 先从缓存获取
    let cached: any = await this.cacheManager.get(`param:${EMAIL_TEMPLATE_KEY}`);
    if (cached) {
      try {
        const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
        if (parsed.data) {
          return { ...DEFAULT_EMAIL_TEMPLATE, ...JSON.parse(parsed.data) };
        }
      } catch (e) {
        console.error('Failed to parse cached email template:', e);
      }
    }

    // 从数据库获取
    const param = await this.baseSysParamEntity.findOne({
      where: { keyName: EMAIL_TEMPLATE_KEY },
    });

    if (param && param.data) {
      try {
        return { ...DEFAULT_EMAIL_TEMPLATE, ...JSON.parse(param.data) };
      } catch (e) {
        console.error('Failed to parse database email template:', e);
      }
    }

    // 返回默认配置
    return DEFAULT_EMAIL_TEMPLATE;
  }

  /**
   * 保存邮件模板配置
   */
  async saveEmailTemplate(template: EmailTemplateConfig): Promise<boolean> {
    try {
      let param = await this.baseSysParamEntity.findOne({
        where: { keyName: EMAIL_TEMPLATE_KEY },
      });

      const templateJson = JSON.stringify(template);

      if (param) {
        param.data = templateJson;
        await this.baseSysParamEntity.save(param);
      } else {
        param = new BaseSysParamEntity();
        param.keyName = EMAIL_TEMPLATE_KEY;
        param.name = 'Email Template Configuration';
        param.data = templateJson;
        param.dataType = 2;
        param.remark = 'Email template and signature configuration';
        await this.baseSysParamEntity.save(param);
      }

      // 更新缓存
      await this.cacheManager.set(
        `param:${EMAIL_TEMPLATE_KEY}`,
        JSON.stringify(param)
      );

      return true;
    } catch (e) {
      console.error('Failed to save email template:', e);
      return false;
    }
  }
}
