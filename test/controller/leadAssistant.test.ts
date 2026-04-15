import { LeadAssistantSessionService } from '../../src/modules/leadAssistant/service/session';

describe('test/controller/leadAssistant.test.ts', () => {
  it('should create, fetch, and patch a lead assistant session', async () => {
    const cache = new Map<string, string>();
    const service = new LeadAssistantSessionService();

    (service as any).cacheManager = {
      async get(key: string) {
        return cache.get(key);
      },
      async set(key: string, value: string) {
        cache.set(key, value);
      },
    };

    const session = await service.createSession(1);
    expect(session.id).toBeTruthy();
    expect(session.departmentId).toBe(1);
    expect(session.status).toBe('drafted');

    const fetched = await service.getSession(session.id, 1);
    expect(fetched.id).toBe(session.id);
    expect(fetched.departmentId).toBe(1);

    const patched = await service.patchSession(session.id, 1, {
      status: 'customer_resolved',
      intakeText: 'John Smith 0412345678',
    });

    expect(patched.status).toBe('customer_resolved');
    expect(patched.intakeText).toBe('John Smith 0412345678');

    const refetched = await service.getSession(session.id, 1);
    expect(refetched.status).toBe('customer_resolved');
    expect(refetched.intakeText).toBe('John Smith 0412345678');
  });
});
