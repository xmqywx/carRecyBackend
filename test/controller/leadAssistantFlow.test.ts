jest.mock('typeorm', () => {
  const actual = jest.requireActual('typeorm');
  return {
    ...actual,
    getConnection: jest.fn(),
  };
});

import { getConnection } from 'typeorm';
import { LeadAssistantCommitService } from '../../src/modules/leadAssistant/service/commit';
import { LeadAssistantCustomerResolveService } from '../../src/modules/leadAssistant/service/customerResolve';
import { LeadAssistantDuplicateCheckService } from '../../src/modules/leadAssistant/service/duplicateCheck';
import { LeadAssistantIntakeService } from '../../src/modules/leadAssistant/service/intake';
import { LeadAssistantScheduleResolveService } from '../../src/modules/leadAssistant/service/scheduleResolve';
import { LeadAssistantSessionService } from '../../src/modules/leadAssistant/service/session';
import { LeadAssistantVehicleResolveService } from '../../src/modules/leadAssistant/service/vehicleResolve';

describe('test/controller/leadAssistantFlow.test.ts', () => {
  it('should complete the V1 happy path from session start to lead commit', async () => {
    const cache = new Map<string, any>();
    const cacheManager = {
      async get(key: string) {
        return cache.get(key);
      },
      async set(key: string, value: any) {
        cache.set(key, value);
      },
    };

    const departmentId = 1;
    const sessionService = new LeadAssistantSessionService();
    (sessionService as any).cacheManager = cacheManager;

    const session = await sessionService.createSession(departmentId);
    expect(session.status).toBe('drafted');

    const intakeService = new LeadAssistantIntakeService();
    (intakeService as any).leadAssistantSessionService = sessionService;
    (intakeService as any).deepseekService = {
      async chatJson() {
        return {
          customer: {
            fullName: 'John Smith',
            phone: '0412345678',
            email: 'john@example.com',
          },
          vehicle: {
            rego: 'BTZ87A',
            vin: 'VIN1234567890',
            state: 'NSW',
            brand: 'Toyota',
            model: 'Hilux',
            year: 2015,
            colour: 'White',
          },
          schedule: {
            pickupAddressText: '12 Smith St, Parramatta NSW',
            preferredTimeText: '2026-04-20 15:00',
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
        };
      },
    };

    const drafted = await intakeService.run(
      session.id,
      departmentId,
      'John Smith 0412345678 Hilux BTZ87A'
    );
    expect(drafted.status).toBe('drafted');

    const customerResolveService = new LeadAssistantCustomerResolveService();
    (customerResolveService as any).leadAssistantSessionService = sessionService;
    (customerResolveService as any).customerProfileEntity = {
      async find() {
        return [];
      },
      createQueryBuilder() {
        return {
          where() {
            return this;
          },
          andWhere() {
            return this;
          },
          getMany: async () => [],
        };
      },
    };

    const customerCandidates = await customerResolveService.resolveCandidates(
      session.id,
      departmentId,
      drafted.extractedDraft.customer
    );
    expect(customerCandidates.recommendedMode).toBe('create-new');

    const customerSelected = await customerResolveService.selectResolution(
      session.id,
      departmentId,
      {
        selectedMode: 'create-new',
      }
    );
    expect(customerSelected.status).toBe('customer_resolved');

    const vehicleResolveService = new LeadAssistantVehicleResolveService();
    (vehicleResolveService as any).leadAssistantSessionService = sessionService;
    (vehicleResolveService as any).carEntity = {
      async find() {
        return [];
      },
    };
    (vehicleResolveService as any).carRegEntity = {
      async findOne() {
        return null;
      },
    };
    (vehicleResolveService as any).orderService = {
      async fetchDataWithV2() {
        return {
          result: {
            vehicle: {
              identification: { plate: 'BTZ87A', vin: 'VIN1234567890', state: 'NSW' },
              details: { make: 'Toyota', model: 'Hilux', year: 2015, colour: 'White' },
            },
          },
        };
      },
    };
    (vehicleResolveService as any).baseSysVehicleEntity = {
      createQueryBuilder() {
        return {
          where() {
            return this;
          },
          andWhere() {
            return this;
          },
          take() {
            return this;
          },
          getMany: async () => [
            { id: 301, brand: 'Toyota', model: 'Hilux', year: 2015, series: 'SR5' },
          ],
        };
      },
    };

    const vehicleCandidates = await vehicleResolveService.resolveCandidates(
      session.id,
      departmentId,
      drafted.extractedDraft.vehicle
    );
    expect(vehicleCandidates.registryLookup).toHaveLength(1);

    const vehicleSelected = await vehicleResolveService.selectResolution(
      session.id,
      departmentId,
      {
        selectedSource: 'registry',
        selectedLookupPayload: vehicleCandidates.registryLookup[0],
      }
    );
    expect(vehicleSelected.status).toBe('vehicle_resolved');

    const scheduleResolveService = new LeadAssistantScheduleResolveService();
    (scheduleResolveService as any).leadAssistantSessionService = sessionService;

    const scheduleResolved = await scheduleResolveService.resolveSchedule(
      session.id,
      departmentId,
      {
        pickupAddress: '12 Smith St, Parramatta NSW',
        pickupAddressState: 'NSW',
        pickupAddressLat: '-33.8136',
        pickupAddressLng: '151.0034',
        expectedDate: '2026-04-20 15:00',
        tempDriverId: '42',
        tempScheduledTime: '09:30',
        tempDuration: '1.5',
      }
    );
    expect(scheduleResolved.scheduleResolution.pickupAddressState).toBe('NSW');

    const duplicateCheckService = new LeadAssistantDuplicateCheckService();
    (duplicateCheckService as any).leadAssistantSessionService = sessionService;
    (duplicateCheckService as any).orderInfoEntity = {
      createQueryBuilder() {
        return {
          leftJoin() {
            return this;
          },
          select() {
            return this;
          },
          where() {
            return this;
          },
          andWhere() {
            return this;
          },
          orderBy() {
            return this;
          },
          limit() {
            return this;
          },
          getRawMany: async () => [],
        };
      },
    };

    const duplicateChecked = await duplicateCheckService.checkDuplicates(
      session.id,
      departmentId,
      {
        phone: drafted.extractedDraft.customer.phone,
        email: drafted.extractedDraft.customer.email,
        rego: drafted.extractedDraft.vehicle.rego,
        vin: drafted.extractedDraft.vehicle.vin,
      }
    );
    expect(duplicateChecked.hasDuplicates).toBe(false);

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
            async findOne(where: Record<string, any>) {
              if (where?.id === 11) {
                return saved.customers[0];
              }
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

    const commitService = new LeadAssistantCommitService();
    (commitService as any).leadAssistantSessionService = sessionService;
    (commitService as any).ctx = {
      admin: {
        userId: 99,
      },
    };

    const committed = await commitService.commitLead(session.id, departmentId);

    expect(committed.status).toBe('lead_committed');
    expect(committed.commitPreview.orderID).toBe(31);
    expect(committed.commitPreview.quoteNumber).toBe('AP0000031');
    expect(saved.customers[0].firstName).toBe('John');
    expect(saved.cars[0].registrationNumber).toBe('BTZ87A');
    expect(saved.orders[saved.orders.length - 1].status).toBe(0);
    expect(saved.actions[0].name).toBe('Lead Creation Copilot');
  });
});
