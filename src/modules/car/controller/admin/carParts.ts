import { Provide, Post, Body, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { CarPartsEntity } from '../../entity/carParts';
import {} from '../../service/car';
import { CarPartsService } from '../../service/car';
import { CarBaseService } from '../../service/car';
import { CarEntity } from '../../entity/base';
import { ContainerEntity } from '../../../container/entity/base';
/**
 * 描述
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CarPartsEntity,

  pageQueryOp: {
    keyWordLikeFields: ['carID'],
    select: [
      'a.*',
      'c.containerNumber',
      'b.model',
      'b.year',
      'b.brand',
      'b.colour',
      'b.vinNumber',
      'b.name',
      'b.registrationNumber',
      'b.state',
      'b.series',
      'b.engine',
      'b.bodyStyle',
      'b.carInfo',
    ],
    fieldEq: [{ column: 'a.carID', requestParam: 'carID' }],
    join: [
      {
        entity: CarEntity,
        alias: 'b',
        condition: 'a.carID = b.id',
        type: 'leftJoin',
      },
      {
        entity: ContainerEntity,
        alias: 'c',
        condition: 'a.containerID = c.id',
        type: 'leftJoin',
      },
    ],
  },
})
export class CarPartsController extends BaseController {
  @Inject()
  carPartsService: CarPartsService;

  @Inject()
  carBaseService: CarBaseService;

  /**
   * 添加零件
   */
  @Post('/add_parts')
  async addParts(@Body('info') info: any) {
    console.log('params', info);
    try {
      await this.carPartsService.addParts(info);
      await this.carBaseService.changeCarStatus(3, info.carID);
      return this.ok();
    } catch (e) {
      console.log('ERROR ', e);
      return this.fail(e);
    }
  }

  @Post('/get_parts_width_ids')
  async gerPartsWidthIds(@Body('ids') ids: number[]) {
    try {
      const list = await this.carPartsService.gerPartsWidthIds(ids);
      return this.ok(list);
    } catch (e) {
      return this.fail(e);
    }
  }
}
