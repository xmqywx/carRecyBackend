import { LeadAssistantIntakeService } from '../../src/modules/leadAssistant/service/intake';

describe('test/controller/leadAssistantIntake.test.ts', () => {
  it('should extract a structured draft and save it back to the session', async () => {
    const intakeService = new LeadAssistantIntakeService();

    (intakeService as any).deepseekService = {
      async chatJson() {
        return {
          customer: { fullName: 'John Smith', phone: '0412345678' },
          vehicle: { rego: 'BTZ87A', brand: 'Toyota', model: 'Hilux', year: 2015 },
          schedule: { pickupAddressText: '12 Smith St, Parramatta NSW', preferredTimeText: 'tomorrow afternoon' },
          money: { askingPrice: 850 },
          notes: { rawIntake: 'raw text' },
        };
      },
    };

    (intakeService as any).leadAssistantSessionService = {
      async patchSession(id: string, departmentId: number, patch: Record<string, any>) {
        return { id, departmentId, status: patch.status, intakeText: patch.intakeText, extractedDraft: patch.extractedDraft };
      },
    };

    const result = await intakeService.run('session-1', 1, 'John Smith 0412345678 Hilux BTZ87A tomorrow Parramatta');

    expect(result.id).toBe('session-1');
    expect(result.status).toBe('drafted');
    expect(result.intakeText).toContain('John Smith');
    expect(result.extractedDraft.customer.phone).toBe('0412345678');
    expect(result.extractedDraft.vehicle.rego).toBe('BTZ87A');
  });
});
