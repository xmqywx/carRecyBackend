jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    getConnection: jest.fn(),
  };
});

import { getConnection } from 'typeorm';
import { LeadAssistantCommitService } from '../../src/modules/leadAssistant/service/commit';
import { LeadAssistantCommController } from '../../src/modules/leadAssistant/controller/admin/comm';

describe('test/controller/leadAssistantCommit.test.ts', () => {
  it('should create a new customer, car, and lead order from the session', async () => {
    const service = new LeadAssistantCommitService();

    const saved: Record<string, any[]> = {
      customers: [],
      cars: [],
      orders: [],
      actions: [],
    };

    const fakeManager = {
      getRepository(entity) {
        if (entity.name === 'CustomerProfileEntity') {
          return {
            async save(payload: Record<string, any>) {
              const value = { id: 11, ...payload };
              saved.customers.push(value);
              return value;
            },
            async findOne() {
              return null;
            },
          };
        }
        if (entity.name === 'CarEntity') {
          return {
            async save(payload: Record<string, any>) {
              const value = { id: 21, ...payload };
              saved.cars.push(value);
              return value;
            },
            async findOne() {
              return null;
            },
          };
        }
        if (entity.name === 'OrderInfoEntity') {
          return {
            async save(payload: Record<string, any>) {
              const id = payload.id || 31;
              const value = { id, ...payload };
              saved.orders.push(value);
              return value;
            },
          };
        }
        if (entity.name === 'OrderActionEntity') {
          return {
            async save(payload: Record<string, any>) {
              saved.actions.push(payload);
              return payload;
            },
          };
        }
        if (entity.name === 'BaseSysVehicleEntity') {
          return {
            async findOne() {
              return null;
            },
          };
        }
        throw new Error(`Unexpected repository: ${entity.name}`);
      },
      async query() {
        return [{ name: 'Apex Point' }];
      },
    };

    (getConnection as jest.Mock).mockReturnValue({
      transaction: async (handler: any) => handler(fakeManager),
    });

    (service as any).leadAssistantSessionService = {
      async getSession() {
        return {
          id: 'session-1',
          extractedDraft: {
            customer: {
              fullName: 'John Smith',
              phone: '0412345678',
              email: 'john@example.com',
            },
            vehicle: {
              rego: 'BTZ87A',
              state: 'NSW',
              brand: 'Toyota',
              model: 'Hilux',
              year: 2015,
              colour: 'White',
            },
            schedule: {
              preferredTimeText: 'Tomorrow afternoon',
            },
            money: {
              askingPrice: 850,
              quoteType: 'Fixed',
            },
            notes: {
              rawIntake: 'Customer called in',
              vehicleCondition: 'Not drivable',
              freeform: 'Keys available',
            },
          },
          customerResolution: {
            selectedMode: 'create-new',
          },
          vehicleResolution: {
            selectedSource: 'new',
          },
          scheduleResolution: {
            pickupAddress: '12 Smith St, Parramatta NSW',
            pickupAddressState: 'NSW',
            pickupAddressLat: -33.8136,
            pickupAddressLng: 151.0034,
            expectedDate: '2026-04-20 15:00',
          },
          duplicateCheck: {
            hasDuplicates: false,
          },
        };
      },
      async patchSession(_id: string, _departmentId: number, patch: Record<string, any>) {
        return patch;
      },
    };

    (service as any).ctx = {
      admin: {
        userId: 99,
      },
    };

    const result = await service.commitLead('session-1', 1);

    expect(saved.customers[0].firstName).toBe('John');
    expect(saved.cars[0].registrationNumber).toBe('BTZ87A');
    expect(saved.orders[saved.orders.length - 1].quoteNumber).toBe('AP0000031');
    expect(saved.actions[0].orderID).toBe(31);
    expect(result.status).toBe('lead_committed');
    expect(result.commitPreview.orderID).toBe(31);
  });

  it('should expose the new controller endpoint and delegate commit lead', async () => {
    const controller = new LeadAssistantCommController();
    let calledWith: any = null;

    (controller as any).ok = (value: any) => value;
    (controller as any).leadAssistantCommitService = {
      async commitLead(id: string, departmentId: number, payload: Record<string, any>) {
        calledWith = { id, departmentId, payload };
        return { ok: true };
      },
    };

    const result = await controller.commitLead('session-9', 3, true);

    expect(calledWith).toEqual({
      id: 'session-9',
      departmentId: 3,
      payload: { continueAsNew: true },
    });
    expect(result).toEqual({ ok: true });
  });
});
