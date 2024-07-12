import { Provide, Inject, Post, Body } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/orm';
import { ContainerEntity } from '../../entity/base';
import { ContainerService } from '../../service/base';
import { BuyerEntity } from '../../../buyer/entity/base';
/**
 * 集装箱
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: ContainerEntity,

  listQueryOp: {
    keyWordLikeFields: [],
    fieldEq: [],
    where: async ctx => {
      const { noSealed } = ctx.request.body;
      return [noSealed ? ['a.status != 2', {}] : []];
    },
  },

  pageQueryOp: {
    keyWordLikeFields: [
      'a.containerNumber',
      'a.sealNumber',
      'a.dispatchLocation',
      'a.finalDestination',
    ],
    select: [
      'a.*',
      'b.name as consignee_name',
      'b.phone as consignee_phone',
      'b.address as consignee_address',
    ],
    fieldEq: ['departmentId'],
    where: async ctx => {
      const { noSealed, isOversea } = ctx.request.body;
      return [
        noSealed ? ['a.status != 2', {}] : [],
        isOversea ? ['a.status >= 2', {}] : [],
      ];
    },
    join: [
      {
        entity: BuyerEntity,
        alias: 'b',
        condition: 'a.consigneeID = b.id',
        type: 'leftJoin',
      },
    ],
  },

  service: ContainerService,
})
export class CarBaseController extends BaseController {
  @InjectEntityModel(ContainerEntity)
  containerEntity: Repository<ContainerEntity>;

  @Inject()
  containerService: ContainerService;

  /**
   * 根据containerNumber获取该container下的零件列表
   * @param containerNumber
   * @returns
   */
  @Post('/getContainerXlsxData')
  async getContainerXlsxData(@Body('containerNumber') containerNumber: string) {
    return await this.containerService.getContainerXlsxData(containerNumber);
  }

  /**
   * 检查是否为唯一的containerNumber
   * @param containerNumber
   * @returns
   */
  @Post('/checkIsUniqueContainerNumber')
  async checkIsUniqueContainerNumber(
    @Body('containerNumber') containerNumber: string
  ) {
    const returnData = await this.containerService.checkIsUniqueContainerNumber(
      containerNumber
    );
    return this.ok(returnData);
  }

  /**
   * 检查是否为唯一的sealNumber
   * @param sealNumber
   * @param id
   * @returns
   */
  @Post('/checkIsUniqueSealedNumber')
  async checkIsUniqueSealedNumber(
    @Body('sealNumber') sealNumber: string,
    @Body('id') id: number
  ) {
    const returnData = await this.containerService.checkIsUniqueSealedNumber(
      sealNumber,
      id
    );
    return this.ok(returnData);
  }

  /**
   * 根据创建人获取集装箱内容
   * @param departmentId
   * @param createBy
   * @returns
   */
  @Post('/get_wrecker_container')
  async get_wrecker_container(
    @Body('departmentId') departmentId: string,
    @Body('createBy') createBy: number
  ) {
    const returnData = await this.containerService.get_wrecker_container(
      departmentId,
      createBy
    );
    return this.ok(returnData);
  }

  // /**
  //  * 更改container状态
  //  * @param departmentId
  //  * @param createBy
  //  * @param status
  //  * @param containerID
  //  * @param areEnginesComplete
  //  * @param areEnginesRunningWell
  //  * @param anyIssues
  //  * @param issues
  //  * @param statusChangeTime
  //  * @returns
  //  */
  // @Post('/change_container_status')
  // async change_container_status(
  //   @Body('departmentId') departmentId: string,
  //   @Body('createBy') createBy: number,
  //   @Body('status') status: number,
  //   @Body('containerID') containerID: number,
  //   @Body('areEnginesComplete') areEnginesComplete: number,
  //   @Body('areEnginesRunningWell') areEnginesRunningWell: number,
  //   @Body('anyIssues') anyIssues: number,
  //   @Body('issues') issues: string,
  //   @Body('statusChangeTime') statusChangeTime: string
  // ) {
  //   const returnData = await this.containerService.change_container_status({
  //     status,
  //     containerID,
  //     areEnginesComplete,
  //     areEnginesRunningWell,
  //     anyIssues,
  //     statusChangeTime,
  //     issues,
  //   });
  //   return this.ok(returnData);
  // }

  /**
   * 获取container总价
   * @param params
   * @returns
   */
  @Post('/containerWidthAmountPage')
  async containerWidthAmountPage(@Body() params: any) {
    const data = await this.containerService.containerWidthAmountPage(params);
    return this.ok(data);
  }
}
