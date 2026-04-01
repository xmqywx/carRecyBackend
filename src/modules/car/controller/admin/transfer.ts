import { Provide, Post, Body, Inject } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { TransferService } from '../../service/transfer';

@Provide()
@CoolController()
export class TransferController extends BaseController {
  @Inject()
  transferService: TransferService;

  @Post('/transfer')
  async transfer(
    @Body('carID') carID: number,
    @Body('targetModule') targetModule: string
  ) {
    try {
      await this.transferService.transfer(carID, targetModule);
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }
}
