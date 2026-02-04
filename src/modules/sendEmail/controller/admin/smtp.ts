import { Body, Get, Inject, Post, Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { SmtpConfigService, SmtpConfig, EmailTemplateConfig } from '../../service/smtpConfig';

/**
 * SMTP配置控制器
 */
@Provide()
@CoolController()
export class SmtpConfigController extends BaseController {
  @Inject()
  smtpConfigService: SmtpConfigService;

  /**
   * 获取SMTP配置
   */
  @Get('/config')
  async getConfig() {
    const config = await this.smtpConfigService.getConfig();
    // 密码不返回完整内容，只返回是否已设置
    return this.ok({
      ...config,
      pass: config.pass ? '******' : '',
      hasPassword: !!config.pass,
    });
  }

  /**
   * 保存SMTP配置
   */
  @Post('/config')
  async saveConfig(@Body() body: SmtpConfig) {
    // 如果密码是******，表示不修改密码，需要获取原来的密码
    if (body.pass === '******') {
      const oldConfig = await this.smtpConfigService.getConfig();
      body.pass = oldConfig.pass;
    }

    const success = await this.smtpConfigService.saveConfig(body);
    if (success) {
      return this.ok({ message: 'SMTP configuration saved successfully' });
    } else {
      return this.fail('Failed to save SMTP configuration');
    }
  }

  /**
   * 测试SMTP连接
   */
  @Post('/test-connection')
  async testConnection(@Body() body: SmtpConfig) {
    // 如果密码是******，需要获取原来的密码
    if (body.pass === '******') {
      const oldConfig = await this.smtpConfigService.getConfig();
      body.pass = oldConfig.pass;
    }

    const result = await this.smtpConfigService.testConnection(body);
    if (result.success) {
      return this.ok({ message: result.message });
    } else {
      return this.fail(result.message);
    }
  }

  /**
   * 发送测试邮件
   */
  @Post('/send-test')
  async sendTestEmail(@Body() body: { config: SmtpConfig; toEmail: string }) {
    const { config, toEmail } = body;

    if (!toEmail) {
      return this.fail('Please enter recipient email address');
    }

    // 如果密码是******，需要获取原来的密码
    if (config.pass === '******') {
      const oldConfig = await this.smtpConfigService.getConfig();
      config.pass = oldConfig.pass;
    }

    const result = await this.smtpConfigService.sendTestEmail(config, toEmail);
    if (result.success) {
      return this.ok({ message: result.message });
    } else {
      return this.fail(result.message);
    }
  }

  /**
   * 获取邮件模板配置
   */
  @Get('/template')
  async getTemplate() {
    const template = await this.smtpConfigService.getEmailTemplate();
    return this.ok(template);
  }

  /**
   * 保存邮件模板配置
   */
  @Post('/template')
  async saveTemplate(@Body() body: EmailTemplateConfig) {
    const success = await this.smtpConfigService.saveEmailTemplate(body);
    if (success) {
      return this.ok({ message: 'Email template saved successfully' });
    } else {
      return this.fail('Failed to save email template');
    }
  }
}
