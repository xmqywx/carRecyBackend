import { LeadAssistantCommController } from '../../src/modules/leadAssistant/controller/admin/comm';
import { LeadAssistantDuplicateCheckService } from '../../src/modules/leadAssistant/service/duplicateCheck';

describe('test/controller/leadAssistantDuplicateCheck.test.ts', () => {
  it('should rank duplicate candidates and persist duplicate check results', async () => {
    const service = new LeadAssistantDuplicateCheckService();

    const rows = [
      {
        orderID: 101,
        customerID: 11,
        carID: 21,
        quoteNumber: 'Q-101',
        createTime: '2026-04-15 10:00:00',
        status: 1,
        firstName: 'John',
        surname: 'Smith',
        phoneNumber: '0412 345 678',
        emailAddress: 'john@example.com',
        registrationNumber: 'btz87a',
        vinNumber: 'vin1234567890',
        state: 'nsw',
        brand: 'Toyota',
        model: 'Hilux',
        year: 2015,
      },
      {
        orderID: 102,
        customerID: 12,
        carID: 22,
        quoteNumber: 'Q-102',
        createTime: '2026-04-14 09:00:00',
        status: 2,
        firstName: 'Jane',
        surname: 'Roe',
        phoneNumber: '0412345678',
        emailAddress: 'jane@example.com',
        registrationNumber: 'XYZ123',
        vinNumber: 'VIN0000000000',
        state: 'NSW',
        brand: 'Mazda',
        model: 'BT-50',
        year: 2017,
      },
    ];

    (service as any).orderInfoEntity = {
      createQueryBuilder() {
        return {
          leftJoin() { return this; },
          select() { return this; },
          where() { return this; },
          andWhere() { return this; },
          orderBy() { return this; },
          limit() { return this; },
          getRawMany: async () => rows,
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

    const result = await service.checkDuplicates('session-1', 1, {
      phone: '0412 345 678',
      email: 'john@example.com',
      rego: 'btz87a',
      vin: 'vin1234567890',
    });

    expect(result.hasDuplicates).toBe(true);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0].orderID).toBe(101);
    expect(result.candidates[0].matchReasons).toEqual(
      expect.arrayContaining(['phone', 'email', 'rego', 'vin'])
    );
    expect(result.candidates[0].score).toBeGreaterThan(result.candidates[1].score);
    expect(patchedPayload.status).toBe('duplicate_checked');
    expect(patchedPayload.duplicateCheck.candidates).toHaveLength(2);
  });

  it('should expose the new controller endpoint and delegate duplicate checks', async () => {
    const controller = new LeadAssistantCommController();
    let calledWith: any = null;

    (controller as any).ok = (value: any) => value;
    (controller as any).leadAssistantDuplicateCheckService = {
      async checkDuplicates(id: string, departmentId: number, draftLead: Record<string, any>) {
        calledWith = { id, departmentId, draftLead };
        return { ok: true };
      },
    };

    const result = await controller.checkDuplicates('session-2', 3, {
      phone: '0412345678',
      rego: 'BTZ87A',
    });

    expect(calledWith).toEqual({
      id: 'session-2',
      departmentId: 3,
      draftLead: {
        phone: '0412345678',
        rego: 'BTZ87A',
      },
    });
    expect(result).toEqual({ ok: true });
  });
});
