import { Provide, Inject, Post } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { CarLabelsEntity } from '../../entity/carLabels';
import { CarLabelsService } from '../../service/car';
/**
 * 描述
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: CarLabelsEntity,
})
export class CarLabelsController extends BaseController {
    @Inject()
    CarLabelsService: CarLabelsService

    @Post('/add_parts')
    async addParts() {

    }
}
