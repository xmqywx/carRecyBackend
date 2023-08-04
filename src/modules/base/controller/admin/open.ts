import { Provide, Body, Inject, Post, Get, Query } from '@midwayjs/decorator';
import { CoolController, BaseController, CoolEps } from '@cool-midway/core';
import { LoginDTO } from '../../dto/login';
import { BaseSysLoginService } from '../../service/sys/login';
import { BaseSysParamService } from '../../service/sys/param';
import { BaseWreckingSearchService } from '../../service/sys/wreckingSearch';
import { Context } from '@midwayjs/koa';
import { Validate } from '@midwayjs/validate';
import { CoolFile } from '@cool-midway/file';
import { OrderService } from '../../../order/service/order';
import getDocs from '../../../sendEmail/sendMailToGetDocs';
import { CarWreckedService, CarBaseService } from '../../../car/service/car';
import { BaseOpenService } from '../../service/sys/open';

const url = require('url');
const querystring = require('querystring');
interface JwtPayload {
  orderID: number;
  // Add other properties as needed
}
/**
 * 不需要登录的后台接口
 */
@Provide()
@CoolController()
export class BaseOpenController extends BaseController {
  @Inject()
  baseSysLoginService: BaseSysLoginService;

  @Inject()
  baseSysParamService: BaseSysParamService;

  @Inject()
  baseWreckingSearchService: BaseWreckingSearchService;

  @Inject()
  ctx: Context;

  @Inject()
  eps: CoolEps;

  @Inject()
  coolFile: CoolFile;

  @Inject()
  orderService: OrderService

  @Inject()
  carWreckedService: CarWreckedService

  @Inject()
  carBaseService: CarBaseService

  @Inject()
  baseOpenService: BaseOpenService

  /**
   * 实体信息与路径
   * @returns
   */
  @Get('/eps', { summary: '实体信息与路径' })
  public async getEps() {
    return this.ok(this.eps.admin);
  }

  /**
   * 根据配置参数key获得网页内容(富文本)
   */
  @Get('/html', { summary: '获得网页内容的参数值' })
  async htmlByKey(@Query('key') key: string) {
    this.ctx.body = await this.baseSysParamService.htmlByKey(key);
  }

  /**
   * 登录
   * @param login
   */
  @Post('/login', { summary: '登录' })
  @Validate()
  async login(@Body() login: LoginDTO) {
    return this.ok(await this.baseSysLoginService.login(login));
  }

  /**
   * 获得验证码
   */
  @Get('/captcha', { summary: '验证码' })
  async captcha(
    @Query('type') type: string,
    @Query('width') width: number,
    @Query('height') height: number
  ) {
    return this.ok(await this.baseSysLoginService.captcha(type, width, height));
  }

  /**
   * 刷新token
   */
  @Get('/refreshToken', { summary: '刷新token' })
  async refreshToken(@Query('refreshToken') refreshToken: string) {
    return this.ok(await this.baseSysLoginService.refreshToken(refreshToken));
  }
  /**
   * 获取分解信息
   * @param id 
   * @returns 
   */
  @Get('/searchBody', { summary: "Search car body" })
  async searchBody(@Query('id') id) {
    return this.ok(await this.baseWreckingSearchService.getBody(id));
  }

  @Get('/searchEngine', { summary: "Search car engine" })
  async searchEngine(@Query('id') id) {
    return this.ok(await this.baseWreckingSearchService.getEngine(id));
  }

  @Get('/searchCatalyticConverter', { summary: "Search car catalytic converter" })
  async searchCatalyticConverter(@Query('id') id) {
    return this.ok(await this.baseWreckingSearchService.getCatalyticConverter(id));
  }

  @Get('/test', { summary: "test" })
  async toTest() {
    return this.ok("Success");
  }

  /**
 * 文件上传
 */
  @Post('/upload', { summary: '文件上传' })
  async upload() {
    const urlObj = url.parse(this.ctx.request.header.referer);
    const queryParams = querystring.parse(urlObj.query);
    const token = queryParams.token;
    console.log(token);
    try {
      await this.orderService.verifyToken(token);
      return this.ok(await this.coolFile.upload(this.ctx));
    } catch (e) {
      return this.fail('The token verification has failed.', e);
    }
  }


  @Post('/sendEmailTogetDocs')
  async sendEmailTogetDocs(@Body('name') name: string, @Body('email') email: string[], @Body('orderID') orderID: number, @Body('textToSend') textToSend: string, @Body('giveUploadBtn') giveUploadBtn: boolean) {
    const token = await this.orderService.generateToken({
      orderID
    });
    await this.orderService.updateOrderAllowUpload(orderID, true);
    // 发送邮件
    const emailPromises = email.map((v: string) => {
      return getDocs({
        email: v, name, token, textToSend, giveUploadBtn
      });
    });
    const emailResults = await Promise.all(emailPromises);
    // 检查是否所有邮件都成功发送
    const isAllEmailSent = emailResults.every((result) => result.status === 'success');
    if (isAllEmailSent) {
      return this.ok({ message: "All emails have been sent successfully." });
    } else {
      return this.fail("Failed to send some emails.");
    }
  }

  @Post('/updateDocs')
  async updateDocs(@Body('registrationDoc') registrationDoc: string, @Body('driverLicense') driverLicense: string, @Body('vehiclePhoto') vehiclePhoto: string, @Body('token') token: string,) {
    try {
      const tokenRes = await this.orderService.verifyToken(token) as JwtPayload;
      const orderID = tokenRes.orderID;
      await this.orderService.updateOrderById(orderID, { registrationDoc, driverLicense, vehiclePhoto });
      return this.ok();
    } catch (e) {
      return this.fail('The token verification has failed.', e);
    }
  }

  @Post("/isAllowUpdate")
  async isAllowUpdate(@Body('token') token: string) {
    console.log(token);
    const tokenRes = await this.orderService.verifyToken(token) as JwtPayload;
    const orderID = tokenRes.orderID;
    const isAllow = await this.orderService.isAllowUpdate(orderID);
    return isAllow;
  }

  @Get("/wrecked_parts")
  async getWreckedParts(@Query('dn') dn: string) {
    let queryInfo = await this.carWreckedService.getWreckedInfo(dn);
    let carInfo;
    if(queryInfo && queryInfo.carID) {
      carInfo = await this.carBaseService.getOneCarInfo(queryInfo.carID);
    }
    return this.baseOpenService.returnPartsInfo(queryInfo, carInfo);
  }
  @Get("/wrecked_infos")
  async getWreckedInfo(@Query('disassemblyCategory') disassemblyCategory: string, @Query('carID') carID: number) {
    let carInfo = await this.carBaseService.getOneCarInfo(carID);
    let queryInfos = await this.carWreckedService.getWreckedInfos(carID, disassemblyCategory);
    return this.baseOpenService.returnWreckedInfo(queryInfos, carInfo);
  }
}
