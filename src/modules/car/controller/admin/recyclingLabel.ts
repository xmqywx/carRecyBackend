import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { RecyclingLabelEntity } from '../../entity/recyclingLabel';

/**
 * Recycling Label Controller — CRUD for recycling label definitions.
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: RecyclingLabelEntity,

  pageQueryOp: {
    keyWordLikeFields: ['a.name'],
    fieldEq: [
      { column: 'a.isActive', requestParam: 'isActive' },
    ],
    addOrderBy: () => ({ 'a.sortOrder': 'ASC', 'a.name': 'ASC' }),
  },

  listQueryOp: {
    fieldEq: [
      { column: 'a.isActive', requestParam: 'isActive' },
    ],
    addOrderBy: () => ({ 'a.sortOrder': 'ASC', 'a.name': 'ASC' }),
  },
})
export class RecyclingLabelController extends BaseController {}
