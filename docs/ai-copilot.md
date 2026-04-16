# AI Copilot for New Booking — Backend Notes

Operator and developer notes for the 2026-04-16 AI Copilot feature. See `apexpoint-front/docs/superpowers/plans/2026-04-16-plan-ai-copilot-booking.md` for the full plan.

## V1 driver-query pattern (harvested from LeadAssistantDriverStep.vue before deletion on 2026-04-16)

> Source file: `src/modules/lead-assistant/components/steps/LeadAssistantDriverStep.vue`,
> deleted in commit `ab618cf` on branch `feat/ai-copilot-2026-04-16`. Recoverable via
> `git show ab618cf:src/modules/lead-assistant/components/steps/LeadAssistantDriverStep.vue`
> or from the `wip: snapshot 2026-04-16 pre-ai-copilot` commit on main.

The V1 wizard loaded drivers via the generic sys-user API — there is no dedicated lead-assistant driver endpoint.

- **Frontend API**: `sysUserApi.list(...)` (primary) / `sysUserApi.page(...)` (fallback on error)
- **Backend endpoint**: `POST /admin/base/sys/user/list` (primary) / `POST /admin/base/sys/user/page` (fallback)
- **Filter criteria**: `{ label: 'driver', departmentId: <current department id> }`
  - `label: 'driver'` is passed as a filter parameter (maps to a role/label field on `base_sys_user` or a related role table — exact backend column depends on cool-admin's user model)
  - `departmentId` comes from `useLeadAssistantStore().departmentId`, which is sourced from `useAppStore().currentDepartmentId` (the currently-selected yard/department)
- **Where the role/filter was sourced**: `label: 'driver'` is hardcoded in the component as the string `'driver'`. No role ID or DB lookup — the backend is expected to filter by a label/role column named "driver".

**Implication for M4.1 DriverAvailabilityService**: The V1 approach re-uses the generic sys-user list endpoint with a label filter — no dedicated driver availability endpoint exists. M4 should design a proper `POST /admin/base/comm/lead-assistant/drivers` (or similar) endpoint that:
1. Accepts `departmentId` and optionally `date` / `timeWindow` parameters
2. Returns a filtered list of users with role/label `driver` in that department
3. Optionally enriches with availability/schedule data (the V1 step only showed name + a manually-entered time slot — no real availability data was fetched)

The V1 frontend component (`src/modules/lead-assistant/components/steps/LeadAssistantDriverStep.vue`) called the generic user list and showed a dropdown — driver "availability" was entered manually by the user, not fetched from any backend availability service.

### Reuse verdict

**Not reusable as-is.** The V1 wizard used a generic `sysUserApi.list({ label: 'driver' })` call;
no dedicated driver-availability endpoint exists. M4.1 DriverAvailabilityService must be built
from scratch, though it may reuse the `label: 'driver'` + `departmentId` filter shape when
querying `base_sys_user`.

## Production schema migration (required before prod deploy)

```sql
ALTER TABLE `order_action` MODIFY COLUMN `description` TEXT NULL;
```

- Non-locking for reads; briefly blocks writes during rewrite
- Backwards compatible (TEXT accepts any VARCHAR payload)
- Rollback: not required if feature is rolled back; TEXT still accepts
  any VARCHAR the old code wrote
- Dev environment: TypeORM `synchronize: true` handles this automatically
  when the backend starts with the new entity. No manual action.
