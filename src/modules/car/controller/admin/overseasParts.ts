import { Provide, Post, Body, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { OverseasPartsEntity } from '../../entity/overseasParts';
import { OverseasPartsService } from '../../service/overseasParts';

@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: OverseasPartsEntity,

  pageQueryOp: {
    keyWordLikeFields: ['a.partName', 'a.vehicleName'],
    fieldEq: [
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'a.containerID', requestParam: 'containerID' },
      { column: 'a.buyerID', requestParam: 'buyerID' },
      { column: 'a.status', requestParam: 'status' },
      { column: 'a.condition', requestParam: 'condition' },
    ],
    addOrderBy: () => ({ 'a.createTime': 'DESC' }),
  },
})
export class OverseasPartsController extends BaseController {
  @Inject()
  overseasPartsService: OverseasPartsService;

  @Post('/addPart')
  async addPart(@Body() body: any) {
    try {
      const part = await this.overseasPartsService.addPart(body);
      return this.ok(part);
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/batchAdd')
  async batchAdd(@Body('carID') carID: number, @Body('parts') parts: any[]) {
    try {
      const result = await this.overseasPartsService.batchAdd(carID, parts);
      return this.ok(result);
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/batchAssignContainer')
  async batchAssignContainer(
    @Body('partIDs') partIDs: number[],
    @Body('containerID') containerID: number
  ) {
    try {
      await this.overseasPartsService.batchAssignContainer(partIDs, containerID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/unassignFromContainer')
  async unassignFromContainer(@Body('partID') partID: number) {
    try {
      await this.overseasPartsService.unassignFromContainer(partID);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/voidPart')
  async voidPart(@Body('id') id: number) {
    try {
      await this.overseasPartsService.voidPart(id);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/markLoaded')
  async markLoaded(@Body('id') id: number) {
    try {
      await this.overseasPartsService.markPartLoaded(id);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/batchMarkLoaded')
  async batchMarkLoaded(@Body('partIDs') partIDs: number[]) {
    try {
      await this.overseasPartsService.batchMarkLoaded(partIDs);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }
}
