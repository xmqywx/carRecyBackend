/**
 * Unit tests for DriverAvailabilityService — classification logic.
 * Uses fully-mocked dependencies; no DB connection required.
 *
 * TODO(M5): add integration tests against a seeded test DB to verify
 * the full recommendDrivers() flow including role-join and date-range queries.
 */

import {
  computeSlack,
  classifyDriver,
  DriverAvailabilityService,
} from '../../src/modules/leadAssistant/service/driverRecommend';

// ---------------------------------------------------------------------------
// Pure-function tests (computeSlack + classifyDriver)
// ---------------------------------------------------------------------------

describe('computeSlack', () => {
  const base = new Date('2026-04-20T10:00:00.000Z').getTime();
  const targetStart = base;
  const targetEnd = base + 2 * 60 * 60_000; // 10:00–12:00

  it('returns Infinity when there are no jobs', () => {
    expect(computeSlack(targetStart, targetEnd, [])).toBe(Infinity);
  });

  it('returns -1 when a job overlaps the target window', () => {
    const slack = computeSlack(targetStart, targetEnd, [
      {
        schedulerStart: new Date(base + 30 * 60_000).toISOString(), // 10:30
        schedulerEnd: new Date(base + 90 * 60_000).toISOString(),   // 11:30
      },
    ]);
    expect(slack).toBe(-1);
  });

  it('returns the gap in minutes when a job is after the window', () => {
    // job 13:00–14:00, window 10:00–12:00 → gap = 60 min
    const slack = computeSlack(targetStart, targetEnd, [
      {
        schedulerStart: new Date(base + 3 * 60 * 60_000).toISOString(),
        schedulerEnd: new Date(base + 4 * 60 * 60_000).toISOString(),
      },
    ]);
    expect(slack).toBeCloseTo(60);
  });

  it('returns the gap in minutes when a job is before the window', () => {
    // job 07:00–08:30, window 10:00–12:00 → gap = 90 min
    const slack = computeSlack(targetStart, targetEnd, [
      {
        schedulerStart: new Date(base - 3 * 60 * 60_000).toISOString(),
        schedulerEnd: new Date(base - 90 * 60_000).toISOString(),
      },
    ]);
    expect(slack).toBeCloseTo(90);
  });
});

describe('classifyDriver', () => {
  const base = new Date('2026-04-20T10:00:00.000Z').getTime();
  const targetStart = base;
  const targetEnd = base + 2 * 60 * 60_000;

  it('classifies as unassigned-eligible when driver has no jobs today', () => {
    const result = classifyDriver(targetStart, targetEnd, []);
    expect(result.status).toBe('unassigned-eligible');
    expect(result.estimatedFit).toBe(0.3);
  });

  it('classifies as conflict when a job overlaps', () => {
    const result = classifyDriver(targetStart, targetEnd, [
      {
        schedulerStart: new Date(base + 30 * 60_000).toISOString(),
        schedulerEnd: new Date(base + 90 * 60_000).toISOString(),
      },
    ]);
    expect(result.status).toBe('conflict');
    expect(result.estimatedFit).toBe(0.0);
    expect(result.conflictReason).toBeTruthy();
  });

  it('classifies as tight when nearest job is within 15-45 min', () => {
    // job ends 30 min before the window
    const result = classifyDriver(targetStart, targetEnd, [
      {
        schedulerStart: new Date(base - 90 * 60_000).toISOString(),
        schedulerEnd: new Date(base - 30 * 60_000).toISOString(), // 30 min gap
      },
    ]);
    expect(result.status).toBe('tight');
    expect(result.estimatedFit).toBe(0.6);
  });

  it('classifies as available when nearest job is ≥45 min away', () => {
    // job ends 60 min before the window
    const result = classifyDriver(targetStart, targetEnd, [
      {
        schedulerStart: new Date(base - 120 * 60_000).toISOString(),
        schedulerEnd: new Date(base - 60 * 60_000).toISOString(), // 60 min gap
      },
    ]);
    expect(result.status).toBe('available');
    expect(result.estimatedFit).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// Smoke test: recommendDrivers with fully-mocked dependencies
// ---------------------------------------------------------------------------

describe('DriverAvailabilityService.recommendDrivers (mocked)', () => {
  it('returns response with expected shape and sorts by estimatedFit DESC', async () => {
    const service = new DriverAvailabilityService();

    const base = new Date('2026-04-20T10:00:00.000Z').getTime();

    // Mock session service
    (service as any).leadAssistantSessionService = {
      async getSession() {
        return {
          id: 'sess-test',
          departmentId: 1,
          scheduleResolution: {
            expectedDate: new Date(base).toISOString(),
          },
        };
      },
    };

    // Mock role entity → driver role found
    (service as any).baseSysRoleEntity = {
      async findOne() {
        return { id: 5, label: 'driver', name: 'Driver' };
      },
    };

    // Two users in driver role
    (service as any).baseSysUserRoleEntity = {
      async find() {
        return [{ userId: 10, roleId: 5 }, { userId: 11, roleId: 5 }];
      },
    };

    // Two active drivers in department 1
    (service as any).baseSysUserEntity = {
      createQueryBuilder() {
        return {
          where() { return this; },
          andWhere() { return this; },
          async getMany() {
            return [
              { id: 10, name: 'Alice', status: 1, departmentId: 1 },
              { id: 11, name: 'Bob',   status: 1, departmentId: 1 },
            ];
          },
        };
      },
    };

    // Alice has a conflicting job; Bob has no jobs
    (service as any).jobEntity = {
      createQueryBuilder() {
        let driverId: number | null = null;
        const qb = {
          where(_q: string, params: any) {
            driverId = params.driverId;
            return this;
          },
          andWhere() { return this; },
          async getMany() {
            if (driverId === 10) {
              // Alice: overlapping job
              return [{
                schedulerStart: new Date(base + 30 * 60_000).toISOString(),
                schedulerEnd:   new Date(base + 90 * 60_000).toISOString(),
              }];
            }
            // Bob: no jobs
            return [];
          },
        };
        return qb;
      },
    };

    const result = await service.recommendDrivers('sess-test', 1);

    expect(result).toHaveProperty('candidates');
    expect(result).toHaveProperty('scheduleAnchor');
    expect(Array.isArray(result.candidates)).toBe(true);

    // Bob (unassigned-eligible, 0.3) should rank above Alice (conflict, 0.0)
    expect(result.candidates[0].name).toBe('Bob');
    expect(result.candidates[0].status).toBe('unassigned-eligible');
    expect(result.candidates[1].name).toBe('Alice');
    expect(result.candidates[1].status).toBe('conflict');
  });
});
