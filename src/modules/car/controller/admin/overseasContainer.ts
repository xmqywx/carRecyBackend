import { Provide, Post, Body, Inject, Get, Query } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { OverseasContainerEntity } from '../../entity/overseasContainer';
import { OverseasVehicleService } from '../../service/overseasVehicle';

/**
 * Overseas Container Controller
 *
 * Auto-CRUD for container management + custom operations.
 */
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

  @Get('/vehicles')
  async getVehicles(@Query('containerID') containerID: number) {
    try {
      const vehicles = await this.overseasVehicleService.getVehiclesByContainer(containerID);
      return this.ok(vehicles);
    } catch (e) {
      return this.fail(e);
    }
  }
}
