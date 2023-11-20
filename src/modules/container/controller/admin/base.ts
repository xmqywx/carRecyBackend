import {Provide, Inject, Post, Body} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { Repository } from "typeorm";
import {InjectEntityModel} from "@midwayjs/orm";
import { ContainerEntity } from '../../entity/base';
import { ContainerService } from '../../service/base';

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: ContainerEntity,

  listQueryOp: {
    keyWordLikeFields: [],
    fieldEq: [],
    where:  async (ctx) => {
      const { noSealed } = ctx.request.body;
      return [
        noSealed ? ['a.status != 2', {}]:[],
        // isVFP ? ['a.isVFP = true', {}] : ['(a.isVFP is NULL or a.isVFP = false)', {}]
        // isCompleted ? ['b.actualPaymentPrice > :actualPaymentPrice and c.status = 4', {actualPaymentPrice: 0}]:[],
      ]
    },
  },

  pageQueryOp: {
    keyWordLikeFields: [],
    select: [
      'a.*',
    ],

  },

  service: ContainerService
})
export class CarBaseController extends BaseController {
  @InjectEntityModel(ContainerEntity)
  containerEntity: Repository<ContainerEntity>

  @Inject()
  containerService: ContainerService;

  @Post("/getContainerXlsxData")
  async getContainerXlsxData(@Body('containerNumber') containerNumber: string) {
    return await this.containerService.getContainerXlsxData(containerNumber);
  }

  @Post("/checkIsUniqueContainerNumber")
  async checkIsUniqueContainerNumber(@Body('containerNumber') containerNumber: string) {
    const returnData = await this.containerService.checkIsUniqueContainerNumber(containerNumber);
    return this.ok(returnData);
  }
}
