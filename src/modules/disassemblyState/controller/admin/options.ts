import {Provide} from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { Repository } from "typeorm";
import {InjectEntityModel} from "@midwayjs/orm";
import { DisassemblyOptionsEntity } from '../../entity/options';

/**
 * 图片空间信息
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: DisassemblyOptionsEntity,

  listQueryOp: {
    keyWordLikeFields: [],
    fieldEq: [
      { column: 'a.category', requestParam: 'category' },
    ],
  },

  pageQueryOp: {
    keyWordLikeFields: [],
    select: [
      'a.*',
    ],
  },

})

export class DisassemblyOptionsController extends BaseController {
  @InjectEntityModel(DisassemblyOptionsEntity)
  disassemblyOptionsEntity: Repository<DisassemblyOptionsEntity>

}
