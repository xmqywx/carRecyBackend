import { Provide, Inject, Get, Post, Body, ALL } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { BaseSysUserEntity } from '../../entity/sys/user';
import { BaseSysLoginService } from '../../service/sys/login';
import { BaseSysPermsService } from '../../service/sys/perms';
import { BaseSysUserService } from '../../service/sys/user';
import { Context } from '@midwayjs/koa';
import { CoolFile } from '@cool-midway/file';
import { CarPartsService } from '../../../car/service/car';
import { CarBaseService } from '../../../car/service/car';
/**
 * Base 通用接口 一般写不需要权限过滤的接口
 */
@Provide()
@CoolController()
export class BaseCommController extends BaseController {
  @Inject()
  baseSysUserService: BaseSysUserService;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  baseSysLoginService: BaseSysLoginService;

  @Inject()
  ctx: Context;

  @Inject()
  coolFile: CoolFile;

  @Inject()
  carPartsService: CarPartsService;

  @Inject()
  carBaseService: CarBaseService;

  /**
   * 获得个人信息
   */
  @Get('/person', { summary: '个人信息' })
  async person() {
    return this.ok(await this.baseSysUserService.person());
  }

  /**
   * 修改个人信息
   */
  @Post('/personUpdate', { summary: '修改个人信息' })
  async personUpdate(@Body(ALL) user: BaseSysUserEntity) {
    await this.baseSysUserService.personUpdate(user);
    return this.ok();
  }

  /**
   * 权限菜单
   */
  @Get('/permmenu', { summary: '权限与菜单' })
  async permmenu() {
    return this.ok(
      await this.baseSysPermsService.permmenu(this.ctx.admin.roleIds)
    );
  }

  /**
   * 文件上传
   */
  @Post('/upload', { summary: '文件上传' })
  async upload() {
    return this.ok(await this.coolFile.upload(this.ctx));
  }

  /**
   * 文件上传模式，本地或者云存储
   */
  @Get('/uploadMode', { summary: '文件上传模式' })
  async uploadMode() {
    return this.ok(await this.coolFile.getMode());
  }

  /**
   * 退出
   */
  @Post('/logout', { summary: '退出' })
  async logout() {
    await this.baseSysLoginService.logout();
    return this.ok();
  }

  @Post('/car_parts_list')
  async carPartsList(@Body('carID') carID: number) {
    try {
      const partsList = await this.carPartsService.carPartsList(carID)
      return this.ok(partsList);
    } catch(e) {
      return this.fail(e);
    }
  }

  @Post('/car_dismantling_status')
  async carDismantlingStatus(@Body('carID') carID: number) {
    try {
      const carInfo = await this.carBaseService.getOneCarInfo(carID);
      return this.ok(carInfo.dismantlingStatus);
    } catch(e) {
      return this.fail(e);
    }
  }

  @Post('/cars_parts_stats')
  async carsPartsStats(@Body('departmentId') departmentId: number) {
    try {
      return this.ok(await this.carBaseService.carsPartsStats(departmentId))
    } catch(e) {
      return this.fail(e);
    }
  }

  @Post('/count_parts_in_container')
  async countPartsInContainer(@Body('departmentId') departmentId: number) {
    try {
      return this.ok(await this.carPartsService.countPartsInContainer(departmentId))
    } catch(e) {
      return this.fail(e);
    }
  }
}
