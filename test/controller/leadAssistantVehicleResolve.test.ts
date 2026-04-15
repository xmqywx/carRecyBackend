import { LeadAssistantVehicleResolveService } from '../../src/modules/leadAssistant/service/vehicleResolve';

describe('test/controller/leadAssistantVehicleResolve.test.ts', () => {
  it('should collect vehicle candidates from existing cars, registry lookup, and vehicle db', async () => {
    const service = new LeadAssistantVehicleResolveService();

    (service as any).carEntity = {
      async find() {
        return [
          {
            id: 21,
            registrationNumber: 'BTZ87A',
            state: 'NSW',
            vinNumber: 'VIN1234567890',
            brand: 'Toyota',
            model: 'Hilux',
            year: 2015,
            colour: 'White',
          },
        ];
      },
    };

    (service as any).carRegEntity = {
      async findOne() {
        return null;
      },
    };

    (service as any).orderService = {
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

    (service as any).baseSysVehicleEntity = {
      createQueryBuilder() {
        return {
          where() { return this; },
          andWhere() { return this; },
          take() { return this; },
          getMany: async () => [
            { id: 301, brand: 'Toyota', model: 'Hilux', year: 2015, series: 'SR5' },
          ],
        };
      },
    };

    let patchedPayload: any = null;
    (service as any).leadAssistantSessionService = {
      async patchSession(id: string, departmentId: number, patch: Record<string, any>) {
        patchedPayload = { id, departmentId, ...patch };
        return patchedPayload;
      },
    };

    const result = await service.resolveCandidates('session-1', 1, {
      rego: 'BTZ87A',
      state: 'NSW',
      brand: 'Toyota',
      model: 'Hilux',
      year: 2015,
    });

    expect(result.vehicleResolution.existingVehicles).toHaveLength(1);
    expect(result.vehicleResolution.registryLookup).toHaveLength(1);
    expect(result.vehicleResolution.vehicleDbCandidates).toHaveLength(1);
    expect(result.vehicleResolution.existingVehicles[0].recommendedAction).toBe('use-existing');
    expect(patchedPayload.vehicleResolution.existingVehicles).toHaveLength(1);
  });

  it('should persist the selected vehicle resolution', async () => {
    const service = new LeadAssistantVehicleResolveService();

    let patchedPayload: any = null;
    const existingSession = {
      id: 'session-1',
      departmentId: 1,
      vehicleResolution: {
        existingVehicles: [{ id: 21, label: '2015 Toyota Hilux' }],
      },
    };
    (service as any).leadAssistantSessionService = {
      async getSession(id: string, departmentId: number) {
        expect(id).toBe('session-1');
        expect(departmentId).toBe(1);
        return existingSession;
      },
      async patchSession(id: string, departmentId: number, patch: Record<string, any>) {
        patchedPayload = { id, departmentId, ...patch };
        return patchedPayload;
      },
    };

    const result = await service.selectResolution('session-1', 1, {
      selectedSource: 'registry',
      selectedVehicleId: 21,
      selectedLookupPayload: { rego: 'BTZ87A' },
    });

    expect(result.vehicleResolution.selectedSource).toBe('registry');
    expect(result.vehicleResolution.existingVehicles).toEqual([{ id: 21, label: '2015 Toyota Hilux' }]);
    expect(patchedPayload.status).toBe('vehicle_resolved');
  });
});
