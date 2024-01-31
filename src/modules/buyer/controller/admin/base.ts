import { BuyerEntity } from './../../entity/base';
import {  Provide, Inject, Post, Body } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { BuyerService } from '../../service/base';
/**
 * 字典信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: BuyerEntity,
  listQueryOp: {
    fieldEq: [],
    keyWordLikeFields: ['name'],
  },
})
export class BuyerController extends BaseController {
  @Inject()
  buyerService: BuyerService;

  @Post("/addOrUpdateBuyerToCarWrecked")
  async addOrUpdateBuyerToCarWrecked(
    @Body('name') name: string,
    @Body('phone') phone: number,
    @Body('address') address: string,
    @Body('id') id: number,
    @Body('partID') partID: number,
    ) {
      const params = {
        name, phone, address, id
      };
      try {
        const result = await this.buyerService.addOrUpdateBuyerToCarWrecked(params, partID);
        if(result) {
          return this.ok(result);
        } else {
          return this.fail();
        }
      } catch(e) {
        return this.fail();
      }
  }

}
