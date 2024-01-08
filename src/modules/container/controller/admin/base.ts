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
    fieldEq: ['departmentId'],
    where:  async (ctx) => {
      const { noSealed, isOversea } = ctx.request.body;
      return [
        noSealed ? ['a.status != 2', {}]:[],
        isOversea ? ['a.status >= 2', {}]:[]
        // isVFP ? ['a.isVFP = true', {}] : ['(a.isVFP is NULL or a.isVFP = false)', {}]
        // isCompleted ? ['b.actualPaymentPrice > :actualPaymentPrice and c.status = 4', {actualPaymentPrice: 0}]:[],
      ]
    },
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

  @Post("/checkIsUniqueSealedNumber")
  async checkIsUniqueSealedNumber(@Body('sealNumber') sealNumber: string, @Body('id') id: number) {
    const returnData = await this.containerService.checkIsUniqueSealedNumber(sealNumber, id);
    return this.ok(returnData);
  }

  @Post("/get_wrecker_container")
  async get_wrecker_container(@Body('departmentId') departmentId: string, @Body('createBy') createBy: number) {
    const returnData = await this.containerService.get_wrecker_container(departmentId, createBy);
    return this.ok(returnData);
  }

  @Post("/change_container_status")
  async change_container_status(@Body('departmentId') departmentId: string, @Body('createBy') createBy: number, @Body('status') status: number, @Body('containerID') containerID: number, @Body('areEnginesComplete') areEnginesComplete: number, @Body('areEnginesRunningWell') areEnginesRunningWell: number, @Body('anyIssues') anyIssues: number, @Body('issues') issues: string,  @Body('statusChangeTime') statusChangeTime: string, ) {
    const returnData = await this.containerService.change_container_status({
      status, containerID, areEnginesComplete, areEnginesRunningWell, anyIssues, statusChangeTime, issues
    });
    return this.ok(returnData);
  }

  // @Post('/containersWithLogs')
  // async getContainersWithLogs() {
  //   return await this.containerService.getContainersWithLogs();
  // }
}
