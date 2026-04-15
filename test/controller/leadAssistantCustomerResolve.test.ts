import { LeadAssistantCustomerResolveService } from '../../src/modules/leadAssistant/service/customerResolve';

describe('test/controller/leadAssistantCustomerResolve.test.ts', () => {
  it('should rank customer candidates and persist the chosen resolution', async () => {
    const service = new LeadAssistantCustomerResolveService();

    const exactPhoneCandidate = {
      id: 11,
      firstName: 'John',
      surname: 'Smith',
      phoneNumber: '0412345678',
      emailAddress: 'john@example.com',
      address: 'Parramatta',
    };

    (service as any).customerProfileEntity = {
      async find(query: Record<string, any>) {
        if (query.phoneNumber === '0412345678') return [exactPhoneCandidate];
        if (query.emailAddress === 'john@example.com') return [exactPhoneCandidate];
        return [];
      },
      createQueryBuilder() {
        return {
          where() { return this; },
          andWhere() { return this; },
          getMany: async () => [exactPhoneCandidate],
        };
      },
    };

    let patchedPayload: any = null;
    const existingSession = {
      id: 'session-1',
      departmentId: 1,
      status: 'drafted',
      customerResolution: {
        candidates: [{ id: 11, label: 'John Smith' }],
        recommendedMode: 'use-existing',
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

    const resolved = await service.resolveCandidates('session-1', 1, {
      fullName: 'John Smith',
      phone: '0412345678',
      email: 'john@example.com',
    });

    expect(resolved.customerResolution.candidates).toHaveLength(1);
    expect(resolved.customerResolution.candidates[0].id).toBe(11);
    expect(resolved.customerResolution.candidates[0].recommendedAction).toBe('use-existing');

    const selected = await service.selectResolution('session-1', 1, {
      selectedMode: 'use-existing',
      selectedCustomerId: 11,
      updateMode: 'missing-fields-only',
    });

    expect(patchedPayload.customerResolution.selectedMode).toBe('use-existing');
    expect(patchedPayload.customerResolution.selectedCustomerId).toBe(11);
    expect(patchedPayload.customerResolution.candidates).toEqual([{ id: 11, label: 'John Smith' }]);
    expect(patchedPayload.customerResolution.recommendedMode).toBe('use-existing');
    expect(selected.customerResolution.updateMode).toBe('missing-fields-only');
  });
});
