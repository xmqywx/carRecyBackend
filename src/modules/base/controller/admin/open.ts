import { Provide, Body, Inject, Post, Get, Query } from '@midwayjs/decorator';
import { CoolController, BaseController, CoolEps } from '@cool-midway/core';
import { LoginDTO } from '../../dto/login';
import { BaseSysLoginService } from '../../service/sys/login';
import { BaseSysParamService } from '../../service/sys/param';
import { Context } from '@midwayjs/koa';
import { Validate } from '@midwayjs/validate';
import { CoolFile } from '@cool-midway/file';
import { OrderService } from '../../../order/service/order';
import getDocs, {
  outPutPdf,
  saveS3,
} from '../../../sendEmail/sendMailToGetDocs';
import { CarWreckedService, CarBaseService } from '../../../car/service/car';
import { BaseOpenService } from '../../service/sys/open';
import { CarPartsService } from '../../../car/service/car';
import { CarCatalyticConverterService } from '../../../car/service/car';
import { JobService } from '../../../job/service/job';
import { BaseSysUserService } from '../../service/sys/user';
import { BaseSysRoleService } from '../../service/sys/role';
import { BaseSysDepartmentService } from '../../service/sys/department';

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
  ctx: Context;

  @Inject()
  eps: CoolEps;

  @Inject()
  coolFile: CoolFile;

  @Inject()
  orderService: OrderService;

  @Inject()
  carWreckedService: CarWreckedService;

  @Inject()
  carBaseService: CarBaseService;

  @Inject()
  baseOpenService: BaseOpenService;

  @Inject()
  carPartsService: CarPartsService;

  @Inject()
  jobService: JobService;

  @Inject()
  carCatalyticConverterService: CarCatalyticConverterService;

  @Inject()
  baseSysUserService: BaseSysUserService;

  @Inject()
  baseSysRoleService: BaseSysRoleService;

  @Inject()
  baseSysDepartmentService: BaseSysDepartmentService;

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

  @Get('/test', { summary: 'test' })
  async toTest() {
    return this.ok('Success');
  }

  /**
   * 文件上传
   */
  @Post('/upload', { summary: '文件上传' })
  async upload() {
    const urlObj = new url.URL(this.ctx.request.header.referer);
    const queryParams = querystring.parse(urlObj.query);
    const token = queryParams.token;
    console.log(token);
    console.log(this.ctx.request.header.referer, urlObj.query);
    try {
      // await this.orderService.verifyToken(token);
      return this.ok(await this.coolFile.upload(this.ctx));
    } catch (e) {
      return this.fail('The token verification has failed.', e);
    }
  }

  @Post('/uploadPartImg', { summary: '文件上传' })
  async uploadPartImg() {
    try {
      return this.ok(await this.coolFile.upload(this.ctx));
    } catch (e) {
      return this.fail('The token verification has failed.', e);
    }
  }

  @Post('/sendEmailTogetDocs')
  async sendEmailTogetDocs(
    @Body('name') name: string,
    @Body('email') email: string[],
    @Body('orderID') orderID: number,
    @Body('textToSend') textToSend: string,
    @Body('giveUploadBtn') giveUploadBtn: boolean,
    @Body('sendBy') sendBy: string
  ) {
    const token = await this.orderService.generateToken({
      orderID,
    });

    // 发送邮件
    let attachment: any = {};
    if (!giveUploadBtn) {
      const buffer = await outPutPdf({ textToSend });
      attachment = await saveS3(buffer);
    } else {
      await this.orderService.updateOrderAllowUpload(orderID, true);
    }

    const emailPromises = email.map((v: string) => {
      return getDocs({
        email: v,
        name,
        token,
        giveUploadBtn,
        attachment,
        sendBy,
        orderID
      });
    });
    const emailResults = await Promise.all(emailPromises);
    // 检查是否所有邮件都成功发送
    const isAllEmailSent = emailResults.every(
      result => result.status === 'success'
    );
    if (isAllEmailSent) {
      if (attachment.path) {
        await this.orderService.saveInvoice(orderID, attachment.path);
      }
      await this.orderService.updateEmailStatus(orderID, giveUploadBtn);
      return this.ok({ message: 'All emails have been sent successfully.' });
    } else {
      return this.fail('Failed to send some emails.');
    }
  }

  @Post('/updateDocs')
  async updateDocs(
    @Body('registrationDoc') registrationDoc: string,
    @Body('driverLicense') driverLicense: string,
    @Body('vehiclePhoto') vehiclePhoto: string,
    @Body('token') token: string
  ) {
    try {
      const tokenRes = (await this.orderService.verifyToken(
        token
      )) as JwtPayload;
      const orderID = tokenRes.orderID;
      await this.orderService.updateOrderById(orderID, {
        registrationDoc,
        driverLicense,
        vehiclePhoto,
      });
      return this.ok();
    } catch (e) {
      return this.fail('The token verification has failed.', e);
    }
  }

  @Post('/isAllowUpdate')
  async isAllowUpdate(@Body('token') token: string) {
    console.log(token);
    const tokenRes = (await this.orderService.verifyToken(token)) as JwtPayload;
    const orderID = tokenRes.orderID;
    const isAllow = await this.orderService.isAllowUpdate(orderID);
    return isAllow;
  }

  // @Get('/wrecked_parts')
  // async getWreckedParts(@Query('dn') dn: string) {
  //   let queryInfo = await this.carWreckedService.getWreckedInfo(dn);
  //   let carInfo;
  //   if (queryInfo && queryInfo.carID) {
  //     carInfo = await this.carBaseService.getOneCarInfo(queryInfo.carID);
  //   }
  //   return this.baseOpenService.returnPartsInfo(queryInfo, carInfo);
  // }

  /**
   *
   * @param dn
   * @param ln
   * @param ld
   * @param catID
   * @param carID
   * @returns
   * 查询label 需要参数：ln: label name, ld: label description, carID
   * 查询part 需要参数：partID, carID
   * 查询cat 需要参数：catID, carID
   */
  @Get('/wrecked_parts')
  async getWreckedParts(
    @Query('partID') partID: number,
    @Query('ln') ln: string,
    @Query('ld') ld: string,
    @Query('catID') catID: number,
    @Query('carID') carID: number
  ) {
    if (carID) {
      let carInfo: any;
      let mapData = {};
      let promise = [];
      promise.push(
        this.carBaseService.getOneCarInfo(carID).then(res => (carInfo = res))
      );
      if (partID) {
        promise.push(
          this.carPartsService.getWreckedInfo(partID).then(res => {
            console.log("PART RES=============", res);
            mapData = {
              'No.': res.disassemblyNumber,
              Name: res.disassmblingInformation,
              Description: res.disassemblyDescription,
              'Part Images': res.disassemblyImages,
              title: 'Part'
            };
          })
        );
      } else if (catID) {
        promise.push(
          this.carCatalyticConverterService.geCatInfo(catID).then(res => {
            mapData = {
              'No.': res.catalyticConverterNumber,
              Name: res.catalyticConverterName,
              Description: res.disassemblyDescription,
              'Part Images': res.disassemblyImages,
              'Cat Type': res.catType,
              'Location of Cat': res.locationOfCat,
              title: 'Catalytic Converter'
            };
          })
        );
      } else if (ln && ld) {
        mapData = {
          Name: ln,
          Description: ld,
          title: 'Label'
        };
      }
      try {
        await Promise.all(promise);
        console.log("MAP DATA ===========", mapData);
        return this.baseOpenService.returnPartsInfo(mapData, carInfo);
      } catch (e) {
        console.log("error ===============", e);
        return this.fail(
          'The QR code is incorrect, please regenerate the QR code.',
          e
        );
      }
    } else {
      return this.fail(
        'The QR code is incorrect, please regenerate the QR code.'
      )
    }
  }

  @Get('/wrecked_infos')
  async getWreckedInfo(
    @Query('disassemblyCategory') disassemblyCategory: string,
    @Query('carID') carID: number
  ) {
    let carInfo = await this.carBaseService.getOneCarInfo(carID);
    let orderInfo = await this.carBaseService.getOneCarOrderInfo(carID);
    let queryInfos = await this.carWreckedService.getWreckedInfos(
      carID,
      disassemblyCategory
    );
    return this.baseOpenService.returnWreckedInfo(
      queryInfos,
      carInfo,
      orderInfo
    );
  }

  // service.car.carParts.list
  // service.car.carParts.update

  @Post('/update_parts_status')
  async updatePartsStatus(@Body('id') id: number, @Body('status') status: number) {
    try {
      const result = await this.carPartsService.updatePartsStatus(id, status);
      return this.ok(result);
    } catch(e) {
      return this.fail(e);
    }
  }

  @Post('/update_car_dismantling_status')
  async updateCarDismantlingStatus(@Body('id') id: number, @Body('status') status: string) {
    try {
      const result = await this.carBaseService.updateCarDismantlingStatus(id, status);
      return this.ok(result);
    } catch(e) {
      return this.fail(e);
    }
  }

  @Post('/open_get_job_info_all')
  async open_get_job_info_all(
    @Body('jobID') jobID: number,
    @Body('orderID') orderID: number
  ) {
    try {
      const searchData = await this.jobService.open_get_job_info_all({
        orderID,
      });
      return this.ok(searchData);
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/create_user')
  async create_user(
    @Body() userData: {
      username: string;
      password: string;
      roleIdList: number[];
      departmentId: string;
      phone: string;
      email: string;
      status: number;
    }
  ) {
      if(await this.baseSysUserService.checkUser(userData.username)) {
        return this.fail('User name already exists');
      }
      const newUser = await this.baseSysUserService.add(userData);
      return this.ok(newUser);
  }

  @Get('/role_department_list')
  async role_depart_list(
  ) {
    let data = {
      roleList: [],
      departmentList: []
    };
    try {
      data.departmentList = await this.baseSysDepartmentService.list();
      data.roleList = await this.baseSysRoleService.reg_role_list();
      return this.ok(data);
    }catch(e) {
      return this.fail('ERROR', e);
    }
  }
}
