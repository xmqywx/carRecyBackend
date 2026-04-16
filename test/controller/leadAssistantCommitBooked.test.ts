/**
 * Tests for LeadAssistantCommitService.commitBooked
 *
 * Strategy: mock typeorm's getConnection (same pattern as leadAssistantCommit.test.ts)
 * and assert that on success both order and job rows are created.
 *
 * TODO(M5): add rollback test — inject a failing jobRepo.save and assert that
 * no orphan order row is left (requires wrapping the mock transaction in a try/catch
 * that re-throws, mirroring real TypeORM transaction behavior).
 */

jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    getConnection: jest.fn(),
  };
});

import { getConnection } from 'typeorm';
import {
  LeadAssistantCommitService,
  ORDER_ACTION_AI_COPILOT_DISPATCH,
} from '../../src/modules/leadAssistant/service/commit';
import { LeadAssistantCommController } from '../../src/modules/leadAssistant/controller/admin/comm';

const BASE_SESSION = {
  id: 'session-booked-1',
  extractedDraft: {
    customer: { fullName: 'Jane Doe', phone: '0411111111', email: 'jane@example.com' },
    vehicle: {
      rego: 'XYZ123',
      state: 'VIC',
      brand: 'Holden',
      model: 'Commodore',
      year: 2012,
      colour: 'Silver',
    },
    schedule: { preferredTimeText: '2026-04-20 09:00' },
    money: { askingPrice: 500, quoteType: 'Fixed' },
    notes: { rawIntake: 'Booked via AI', vehicleCondition: 'Not drivable' },
  },
  customerResolution: { selectedMode: 'create-new' },
  vehicleResolution: { selectedSource: 'new' },
  scheduleResolution: {
    pickupAddress: '99 Test St, Melbourne VIC',
    pickupAddressState: 'VIC',
    pickupAddressLat: -37.8136,
    pickupAddressLng: 144.9631,
    expectedDate: '2026-04-20 09:00',
  },
  duplicateCheck: { hasDuplicates: false },
};

function buildFakeManager(saved: Record<string, any[]>) {
  return {
    getRepository(entity: any) {
      const name = typeof entity === 'string' ? entity : entity.name;

      if (name === 'CustomerProfileEntity') {
        return {
          async save(payload: any) {
            const value = { id: 51, ...payload };
            saved.customers.push(value);
            return value;
          },
          async findOne() { return null; },
        };
      }
      if (name === 'CarEntity') {
        return {
          async save(payload: any) {
            const value = { id: 61, ...payload };
            saved.cars.push(value);
            return value;
          },
          async findOne() { return null; },
        };
      }
      if (name === 'OrderInfoEntity') {
        let idCounter = 71;
        return {
          async save(payload: any) {
            const id = payload.id || idCounter++;
            const value = { id, ...payload };
            saved.orders.push(value);
            return value;
          },
        };
      }
      if (name === 'OrderActionEntity') {
        return {
          async save(payload: any) {
            saved.actions.push(payload);
            return payload;
          },
        };
      }
      if (name === 'JobEntity') {
        return {
          async save(payload: any) {
            const value = { id: 81, ...payload };
            saved.jobs.push(value);
            return value;
          },
        };
      }
      if (name === 'BaseSysVehicleEntity') {
        return { async findOne() { return null; } };
      }
      throw new Error(`Unexpected repository: ${name}`);
    },
    async query() {
      return [{ name: 'Test Yard' }];
    },
  };
}

describe('test/controller/leadAssistantCommitBooked.test.ts', () => {
  it('creates both an order and a job row when commitBooked succeeds', async () => {
    const service = new LeadAssistantCommitService();
    const saved: Record<string, any[]> = {
      customers: [],
      cars: [],
      orders: [],
      actions: [],
      jobs: [],
    };

    const fakeManager = buildFakeManager(saved);

    (getConnection as jest.Mock).mockReturnValue({
      transaction: async (handler: any) => handler(fakeManager),
    });

    (service as any).leadAssistantSessionService = {
      async getSession() { return BASE_SESSION; },
      async patchSession(_id: string, _deptId: number, patch: any) { return patch; },
    };

    (service as any).ctx = { admin: { userId: 42 } };

    const result = await service.commitBooked('session-booked-1', 1, 7);

    // Order created
    expect(saved.orders.length).toBeGreaterThan(0);
    const finalOrder = saved.orders[saved.orders.length - 1];
    expect(finalOrder.status).toBe(1); // Booked

    // Job created
    expect(saved.jobs.length).toBe(1);
    expect(saved.jobs[0].driverID).toBe(7);
    expect(saved.jobs[0].orderID).toBe(71);

    // Audit action created with correct type
    expect(saved.actions.length).toBe(1);
    expect(saved.actions[0].type).toBe(ORDER_ACTION_AI_COPILOT_DISPATCH);
    const desc = JSON.parse(saved.actions[0].description);
    expect(desc.driverId).toBe(7);

    // Return shape
    expect(result).toHaveProperty('orderId');
    expect(result).toHaveProperty('jobId');
    expect(result).toHaveProperty('quoteNumber');
  });

  it('creates a job with null driverID when no driver assigned', async () => {
    const service = new LeadAssistantCommitService();
    const saved: Record<string, any[]> = {
      customers: [], cars: [], orders: [], actions: [], jobs: [],
    };

    (getConnection as jest.Mock).mockReturnValue({
      transaction: async (handler: any) => handler(buildFakeManager(saved)),
    });

    (service as any).leadAssistantSessionService = {
      async getSession() { return BASE_SESSION; },
      async patchSession(_id: string, _deptId: number, patch: any) { return patch; },
    };

    (service as any).ctx = { admin: { userId: 42 } };

    const result = await service.commitBooked('session-booked-1', 1, null);

    expect(saved.jobs[0].driverID).toBeNull();
    expect(saved.jobs[0].status).toBe(0); // unassigned
    expect(result).toHaveProperty('orderId');
  });

  it('exposes the commitBooked controller endpoint and delegates correctly', async () => {
    const controller = new LeadAssistantCommController();
    let calledWith: any = null;

    (controller as any).ok = (value: any) => value;
    (controller as any).leadAssistantCommitService = {
      async commitBooked(id: string, departmentId: number, driverId: number | null) {
        calledWith = { id, departmentId, driverId };
        return { orderId: 99, jobId: 88, quoteNumber: 'TY0000099' };
      },
    };
    // driverAvailabilityService not needed for this test
    (controller as any).driverAvailabilityService = {};

    const result = await controller.commitBooked('sess-7', 2, 15);

    expect(calledWith).toEqual({ id: 'sess-7', departmentId: 2, driverId: 15 });
    expect(result).toEqual({ orderId: 99, jobId: 88, quoteNumber: 'TY0000099' });
  });
});
