import { Provide, Body, Post } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository, In } from 'typeorm';
import { PartsVehicleLabelEntity } from '../../entity/partsVehicleLabel';
import { PartsLabelEntity } from '../../entity/partsLabel';

@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'list', 'page'],
  entity: PartsVehicleLabelEntity,
  pageQueryOp: {
    fieldEq: [
      { column: 'a.partsVehicleId', requestParam: 'partsVehicleId' },
      { column: 'a.labelId', requestParam: 'labelId' },
    ],
  },
  listQueryOp: {
    fieldEq: [
      { column: 'a.partsVehicleId', requestParam: 'partsVehicleId' },
    ],
    addOrderBy: () => ({ 'a.createTime': 'ASC' }),
  },
})
export class PartsVehicleLabelController extends BaseController {
  @InjectEntityModel(PartsVehicleLabelEntity)
  vehicleLabelRepo: Repository<PartsVehicleLabelEntity>;

  @InjectEntityModel(PartsLabelEntity)
  labelRepo: Repository<PartsLabelEntity>;

  @Post('/setLabels')
  async setLabels(
    @Body('partsVehicleId') partsVehicleId: number,
    @Body('labelIds') labelIds: number[],
  ) {
    try {
      const existing = await this.vehicleLabelRepo.find({ where: { partsVehicleId } });
      const existingMap = new Map(existing.map(e => [e.labelId, e.description]));

      await this.vehicleLabelRepo.delete({ partsVehicleId });

      if (labelIds && labelIds.length > 0) {
        const labels = await this.labelRepo.find({ where: { id: In(labelIds) } });
        const labelMap = new Map(labels.map(l => [l.id, l]));

        const records = labelIds.map(labelId => {
          const label = labelMap.get(labelId);
          return {
            partsVehicleId,
            labelId,
            labelName: label?.name || '',
            description: existingMap.get(labelId) ?? label?.description ?? '',
          };
        });
        await this.vehicleLabelRepo.save(records);
      }

      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/updateDescription')
  async updateDescription(
    @Body('id') id: number,
    @Body('description') description: string,
  ) {
    try {
      await this.vehicleLabelRepo.update(id, { description: description || '' });
      return this.ok();
    } catch (e) {
      return this.fail(e);
    }
  }

  @Post('/getByVehicle')
  async getByVehicle(@Body('partsVehicleId') partsVehicleId: number) {
    try {
      const records = await this.vehicleLabelRepo.find({ where: { partsVehicleId } });
      return this.ok(records);
    } catch (e) {
      return this.fail(e);
    }
  }
}
