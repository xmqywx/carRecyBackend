import test from 'node:test'
import assert from 'node:assert/strict'

import { syncUserRoles } from '../src/modules/base/service/sys/user-role-refresh.ts'

test('updateUserRole refreshes cached perms after role changes', async () => {
  const calls: Array<[string, unknown]> = []

  const baseSysUserRoleEntity = {
    delete: async (query: unknown) => calls.push(['delete', query]),
    save: async (query: unknown) => calls.push(['save', query]),
  }
  const baseSysPermsService = {
    refreshPerms: async (userId: number) => calls.push(['refreshPerms', userId]),
  }

  await syncUserRoles(baseSysUserRoleEntity as any, baseSysPermsService as any, {
    id: 117,
    username: 'Maisam',
    roleIdList: [13, 14],
  })

  assert.deepEqual(calls, [
    ['delete', { userId: 117 }],
    ['save', { userId: 117, roleId: 13 }],
    ['save', { userId: 117, roleId: 14 }],
    ['refreshPerms', 117],
  ])
})
