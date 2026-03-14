import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { PartCategoryEntity } from '../../entity/partCategory';

/**
 * Part Category Controller — CRUD for part name templates.
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: PartCategoryEntity,

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
export class PartCategoryController extends BaseController {}
