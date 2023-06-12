import { Inject, Provide } from '@midwayjs/decorator';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { BaseSysUserEntity } from '../../entity/sys/user';
import { BaseSysPermsService } from './perms';
import * as _ from 'lodash';
import { BaseSysUserRoleEntity } from '../../entity/sys/user_role';
import * as md5 from 'md5';
import { BaseSysDepartmentEntity } from '../../entity/sys/department';
import { CacheManager } from '@midwayjs/cache';

/**
 * 系统用户
 */
@Provide()
export class BaseSysUserService extends BaseService {
  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysUserRoleEntity)
  baseSysUserRoleEntity: Repository<BaseSysUserRoleEntity>;

  @InjectEntityModel(BaseSysDepartmentEntity)
  baseSysDepartmentEntity: Repository<BaseSysDepartmentEntity>;

  @Inject()
  cacheManager: CacheManager;

  @Inject()
  baseSysPermsService: BaseSysPermsService;

  @Inject()
  ctx;

  /**
   * 分页查询
   * @param query
   */
  async page(query) {
    const { keyWord, status, roleId, label, departmentIds = [] } = query;
    // const permsDepartmentArr = await this.baseSysPermsService.departmentIds(
    //   this.ctx.admin.userId
    // ); // 部门权限
    const sql = `
        SELECT
            a.id,a.name,a.nickName,a.headImg,a.email,a.remark,a.status,a.createTime,a.updateTime,a.username,a.phone,a.departmentId,
            GROUP_CONCAT(c.name) AS roleName,
            d.name as departmentName
        FROM
            base_sys_user a
            LEFT JOIN base_sys_user_role b ON a.id = b.userId
            LEFT JOIN base_sys_role c ON b.roleId = c.id
            LEFT JOIN base_sys_department d on a.departmentId = d.id
        WHERE 1 = 1
            ${this.setSql(
              roleId,
              'and b.roleId = ?',
              [roleId]
            )}
            ${this.setSql(
              label,
              'and c.label = ?',
              [label]
            )}
            ${this.setSql(
              !_.isEmpty(departmentIds),
              'and a.departmentId in (?)',
              [departmentIds]
            )}
            ${this.setSql(status, 'and a.status = ?', [status])}
            ${this.setSql(keyWord, 'and (a.name LIKE ? or a.username LIKE ?)', [
              `%${keyWord}%`,
              `%${keyWord}%`,
            ])}
            ${this.setSql(true, 'and a.username != ?', ['admin'])}

        GROUP BY a.id
        `;
    return this.sqlRenderPage(sql, query);
    // ${this.setSql(
    //   this.ctx.admin.username !== 'admin',
    //   'and a.departmentId in (?)',
    //   [!_.isEmpty(permsDepartmentArr) ? permsDepartmentArr : [null]]
    // )}
  }

  /**
   * 移动部门
   * @param departmentId
   * @param userIds
   */
  async move(departmentId, userIds) {
    await this.baseSysUserEntity
      .createQueryBuilder()
      .update()
      .set({ departmentId })
      .where('id in (:userIds)', { userIds })
      .execute();
  }

  /**
   * 获得个人信息
   */
  async person() {
    const info: any = await this.baseSysUserEntity.findOne({
      id: this.ctx.admin?.userId,
    });
    info.department = await this.baseSysDepartmentEntity.findOne({
      id: info.departmentId
    });
    info.roles = await this.baseSysUserRoleEntity.find({
      id: info.roleId
    });

    const sql = `
        SELECT
            a.id,a.name,a.nickName,a.headImg,a.email,a.remark,a.status,a.createTime,a.updateTime,a.username,a.phone,
            GROUP_CONCAT(c.name) AS roleName, GROUP_CONCAT(c.id) as roleId, GROUP_CONCAT(c.label) as roleLabel,
            d.name as departmentName, d.id as departmentId
        FROM
            base_sys_user a
            LEFT JOIN base_sys_user_role b ON a.id = b.userId
            LEFT JOIN base_sys_role c ON b.roleId = c.id
            LEFT JOIN base_sys_department d on a.departmentId = d.id
        WHERE 1 = 1
        and a.id = ${this.ctx.admin?.userId}
        GROUP BY a.id
        `
    const list = await this.nativeQuery(sql)
    delete info?.password;
    list.departmentId = list.departmentId + "";
    return list[0];
  }

  /**
   * 更新用户角色关系
   * @param user
   */
  async updateUserRole(user) {
    if (_.isEmpty(user.roleIdList)) {
      return;
    }
    if (user.username === 'admin') {
      throw new CoolCommException('Illegal operation~');
    }
    await this.baseSysUserRoleEntity.delete({ userId: user.id });
    if (user.roleIdList) {
      for (const roleId of user.roleIdList) {
        await this.baseSysUserRoleEntity.save({ userId: user.id, roleId });
      }
    }
    await this.baseSysPermsService.refreshPerms(user.id);
  }

  /**
   * 新增
   * @param param
   */
  async add(param) {
    const exists = await this.baseSysUserEntity.findOne({
      username: param.username,
    });
    if (!_.isEmpty(exists)) {
      throw new CoolCommException('User name already exists~');
    }
    param.password = md5(param.password);
    await this.baseSysUserEntity.save(param);
    await this.updateUserRole(param);
    return param.id;
  }

  /**
   * 根据ID获得信息
   * @param id
   */
  public async info(id) {
    const info = await this.baseSysUserEntity.findOne({ id });
    const userRoles = await this.nativeQuery(
      'select a.roleId from base_sys_user_role a where a.userId = ?',
      [id]
    );
    const department = await this.baseSysDepartmentEntity.findOne({
      id: info.departmentId,
    });
    if (info) {
      delete info.password;
      if (userRoles) {
        info.roleIdList = userRoles.map(e => {
          return parseInt(e.roleId);
        });
      }
    }
    delete info.password;
    if (department) {
      info.departmentName = department.name;
    }
    return info;
  }

  /**
   * 修改个人信息
   * @param param
   */
  public async personUpdate(param) {
    param.id = this.ctx.admin.userId;
    if (!_.isEmpty(param.password)) {
      param.password = md5(param.password);
      const userInfo = await this.baseSysUserEntity.findOne({ id: param.id });
      if (!userInfo) {
        throw new CoolCommException('User does not exist');
      }
      param.passwordV = userInfo.passwordV + 1;
      await this.cacheManager.set(
        `admin:passwordVersion:${param.id}`,
        param.passwordV
      );
    } else {
      delete param.password;
    }
    await this.baseSysUserEntity.save(param);
  }

  /**
   * 修改
   * @param param 数据
   */
  async update(param) {
    if (param.id && param.username === 'admin') {
      throw new CoolCommException('Illegal operation~');
    }
    if (!_.isEmpty(param.password)) {
      param.password = md5(param.password);
      const userInfo = await this.baseSysUserEntity.findOne({ id: param.id });
      if (!userInfo) {
        throw new CoolCommException('User does not exist');
      }
      param.passwordV = userInfo.passwordV + 1;
      await this.cacheManager.set(
        `admin:passwordVersion:${param.id}`,
        param.passwordV
      );
    } else {
      delete param.password;
    }
    if (param.status === 0) {
      await this.forbidden(param.id);
    }
    await this.baseSysUserEntity.save(param);
    await this.updateUserRole(param);
  }

  /**
   * 禁用用户
   * @param userId
   */
  async forbidden(userId) {
    await this.cacheManager.del(`admin:token:${userId}`);
  }
}
