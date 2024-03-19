import { Provide /* ,Body, Post, Inject */ } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { Repository } from 'typeorm';
import { InjectEntityModel } from '@midwayjs/orm';
import { BaseSysUserEntity } from '../../../base/entity/sys/user';
import { CarCommentEntity } from '../../entity/comment';
import { CarEntity } from '../../entity/base';
import { CarCommentService } from '../../service/car';

/**
 * 零件评论
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list'],
  entity: CarCommentEntity,

  listQueryOp: {
    select: ['a.*', 'b.username'],
    // 多表关联，请求筛选字段与表字段不一致的情况
    fieldEq: [{ column: 'a.carID', requestParam: 'carID' }],
    join: [
      {
        entity: BaseSysUserEntity,
        alias: 'b',
        condition: 'a.authorID = b.id',
        type: 'leftJoin',
      },
      {
        entity: CarEntity,
        alias: 'c',
        condition: 'a.carID = c.id',
        type: 'leftJoin',
      },
    ],
  },
  service: CarCommentService,
})
export class CarCommentController extends BaseController {
  @InjectEntityModel(CarCommentEntity)
  carCommentEntity: Repository<CarCommentEntity>;
}
