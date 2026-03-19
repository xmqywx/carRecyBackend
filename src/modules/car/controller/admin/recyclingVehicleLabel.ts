import { Provide, Body, Post } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository, In } from 'typeorm';
import { RecyclingVehicleLabelEntity } from '../../entity/recyclingVehicleLabel';
import { RecyclingLabelEntity } from '../../entity/recyclingLabel';

/**
 * Recycling Vehicle Label Controller — manage label assignments on recycling records.
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'list', 'page'],
  entity: RecyclingVehicleLabelEntity,

  pageQueryOp: {
    fieldEq: [
      { column: 'a.recyclingRecordId', requestParam: 'recyclingRecordId' },
      { column: 'a.labelId', requestParam: 'labelId' },
    ],
  },

  listQueryOp: {
    fieldEq: [
      { column: 'a.recyclingRecordId', requestParam: 'recyclingRecordId' },
    ],
    addOrderBy: () => ({ 'a.createTime': 'ASC' }),
  },
})
export class RecyclingVehicleLabelController extends BaseController {
  @InjectEntityModel(RecyclingVehicleLabelEntity)
  vehicleLabelRepo: Repository<RecyclingVehicleLabelEntity>;

  @InjectEntityModel(RecyclingLabelEntity)
  labelRepo: Repository<RecyclingLabelEntity>;

  /**
   * Set labels for a recycling record (replace all, preserving existing descriptions).
   * Body: { recyclingRecordId: number, labelIds: number[] }
   */
  @Post('/setLabels')
  async setLabels(
    @Body('recyclingRecordId') recyclingRecordId: number,
    @Body('labelIds') labelIds: number[],
  ) {
    try {
      // Get existing to preserve descriptions
      const existing = await this.vehicleLabelRepo.find({ where: { recyclingRecordId } });
      const existingMap = new Map(existing.map(e => [e.labelId, e.description]));

      // Delete all existing
      await this.vehicleLabelRepo.delete({ recyclingRecordId });

      if (labelIds && labelIds.length > 0) {
        const labels = await this.labelRepo.find({ where: { id: In(labelIds) } });
        const labelMap = new Map(labels.map(l => [l.id, l]));

        const records = labelIds.map(labelId => {
          const label = labelMap.get(labelId);
          return {
            recyclingRecordId,
            labelId,
            labelName: label?.name || '',
            // Preserve existing vehicle-level description, or fall back to label default
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

  /**
   * Update description for a specific vehicle-label assignment.
   * Body: { id: number, description: string }
   */
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

  /**
   * Get labels for a recycling record.
   */
  @Post('/getByRecord')
  async getByRecord(@Body('recyclingRecordId') recyclingRecordId: number) {
    try {
      const records = await this.vehicleLabelRepo.find({ where: { recyclingRecordId } });
      return this.ok(records);
    } catch (e) {
      return this.fail(e);
    }
  }
}
