import { Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/orm';
import { DisassemblyCategoryEntity } from '../../entity/category';

/**
 * 拆解分类
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: DisassemblyCategoryEntity,

  listQueryOp: {
    keyWordLikeFields: [],
    fieldEq: [],
  },

  pageQueryOp: {
    keyWordLikeFields: [],
    select: ['a.*'],
  },
})
export class DisassemblyCategoryController extends BaseController {
  @InjectEntityModel(DisassemblyCategoryEntity)
  disassemblyCategoryEntity: Repository<DisassemblyCategoryEntity>;
}
