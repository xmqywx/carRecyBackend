import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { PartClassificationEntity } from '../../entity/partClassification';

/**
 * Part Classification Controller — CRUD for part category groups.
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: PartClassificationEntity,
})
export class PartClassificationController extends BaseController {}
