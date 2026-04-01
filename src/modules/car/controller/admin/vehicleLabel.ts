import { Provide, Post, Body } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { VehicleLabelEntity } from '../../entity/vehicleLabel';
import { LabelEntity } from '../../entity/label';

@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: VehicleLabelEntity,
  pageQueryOp: {
    fieldEq: [
      { column: 'a.carID', requestParam: 'carID' },
      { column: 'a.labelId', requestParam: 'labelId' },
    ],
  },
})
export class VehicleLabelController extends BaseController {
  @InjectEntityModel(VehicleLabelEntity)
  vehicleLabelRepo: Repository<VehicleLabelEntity>;

  @InjectEntityModel(LabelEntity)
  labelRepo: Repository<LabelEntity>;

  /**
   * Set labels for a car (replace all).
   */
  @Post('/setLabels')
  async setLabels(
    @Body('carID') carID: number,
    @Body('labelIds') labelIds: number[]
  ) {
    try {
      await this.vehicleLabelRepo.delete({ carID });
      if (labelIds?.length) {
        const labels = await this.labelRepo.findByIds(labelIds);
        const entities = labels.map(l => ({
          carID,
          labelId: l.id,
          labelName: l.name,
        }));
        await this.vehicleLabelRepo.save(entities);
      }
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Get labels for a car.
   */
  @Post('/getByVehicle')
  async getByVehicle(@Body('carID') carID: number) {
    try {
      const list = await this.vehicleLabelRepo.find({ where: { carID } });
      return this.ok(list);
    } catch (e) {
      return this.fail(e);
    }
  }

  /**
   * Update label description for a specific assignment.
   */
  @Post('/updateDescription')
  async updateDescription(
    @Body('id') id: number,
    @Body('description') description: string
  ) {
    try {
      await this.vehicleLabelRepo.update(id, { description });
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }
}
