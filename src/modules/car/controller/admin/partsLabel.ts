import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { PartsLabelEntity } from '../../entity/partsLabel';

@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: PartsLabelEntity,
  pageQueryOp: {
    keyWordLikeFields: ['a.name'],
    fieldEq: [{ column: 'a.isActive', requestParam: 'isActive' }],
    addOrderBy: () => ({ 'a.sortOrder': 'ASC', 'a.name': 'ASC' }),
  },
  listQueryOp: {
    fieldEq: [{ column: 'a.isActive', requestParam: 'isActive' }],
    addOrderBy: () => ({ 'a.sortOrder': 'ASC', 'a.name': 'ASC' }),
  },
})
export class PartsLabelController extends BaseController {}
