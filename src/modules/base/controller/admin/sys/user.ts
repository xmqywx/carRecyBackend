import { Body, Inject, Post, Provide } from '@midwayjs/decorator';
import { CoolController, BaseController } from '@cool-midway/core';
import { BaseSysUserEntity } from '../../../entity/sys/user';
import { BaseSysUserService } from '../../../service/sys/user';
import {BaseSysRoleEntity} from "../../../entity/sys/role";
import {BaseSysUserRoleEntity} from "../../../entity/sys/user_role";

/**
 * 系统用户
 */
@Provide()
@CoolController({
  api: ['add', 'delete', 'update', 'info', 'list', 'page'],
  entity: BaseSysUserEntity,
  listQueryOp: {
    select: ['a.*', 'c.label'],
    // 多表关联，请求筛选字段与表字段不一致的情况
    fieldEq: [{ column: 'c.label', requestParam: 'label' }, { column: "a.departmentId", requestParam: "departmentId"}],
    join: [{
      entity: BaseSysUserRoleEntity,
      alias: 'b',
      condition: 'a.id = b.userId',
      type: 'leftJoin'
    },{
      entity: BaseSysRoleEntity,
      alias: 'c',
      condition: 'b.roleId = c.id',
      type: 'leftJoin'
    }]
  },
  service: BaseSysUserService,
})
export class BaseSysUserController extends BaseController {
  @Inject()
  baseSysUserService: BaseSysUserService;

  /**
   * 移动部门
   */
  @Post('/move', { summary: '移动部门' })
  async move(
    @Body('departmentId') departmentId: number,
    @Body('userIds') userIds: []
  ) {
    await this.baseSysUserService.move(departmentId, userIds);
    return this.ok();
  }
}
