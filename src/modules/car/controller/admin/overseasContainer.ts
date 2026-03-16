import { Provide, Post, Body, Inject, Get, Query } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { OverseasContainerEntity } from '../../entity/overseasContainer';
import { OverseasVehicleService } from '../../service/overseasVehicle';
import { OverseasPartsService } from '../../service/overseasParts';

@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: OverseasContainerEntity,

  pageQueryOp: {
    keyWordLikeFields: ['a.containerNumber', 'a.sealNumber', 'a.consigneeName', 'a.destinationCountry'],
    fieldEq: [
      { column: 'a.status', requestParam: 'status' },
      { column: 'a.consigneeID', requestParam: 'consigneeID' },
      { column: 'a.destinationCountry', requestParam: 'destinationCountry' },
    ],
    addOrderBy: () => ({ 'a.createTime': 'DESC' }),
  },
})
export class OverseasContainerController extends BaseController {
  @Inject()
  overseasVehicleService: OverseasVehicleService;

  @Inject()
  overseasPartsService: OverseasPartsService;

  @Post('/changeStatus')
  async changeStatus(
    @Body('id') id: number,
    @Body('status') status: string
  ) {
    try {
      await this.overseasVehicleService.changeContainerStatus(id, status);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Get('/parts')
  async getParts(@Query('containerID') containerID: number) {
    try {
      const parts = await this.overseasPartsService.getPartsByContainer(containerID);
      return this.ok(parts);
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/refreshStats')
  async refreshStats(@Body('id') id: number) {
    try {
      await this.overseasPartsService.refreshContainerStats(id);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }
}
