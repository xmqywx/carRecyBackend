export async function syncUserRoles(baseSysUserRoleEntity, baseSysPermsService, user) {
  if (!Array.isArray(user.roleIdList) || user.roleIdList.length === 0) {
    return;
  }
  if (user.username === 'admin') {
    throw new Error('Illegal operation~');
  }
  await baseSysUserRoleEntity.delete({ userId: user.id });
  for (const roleId of user.roleIdList) {
    await baseSysUserRoleEntity.save({ userId: user.id, roleId });
  }
  await baseSysPermsService.refreshPerms(user.id);
}
