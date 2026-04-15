import { LeadAssistantScheduleResolveService } from '../../src/modules/leadAssistant/service/scheduleResolve';

describe('test/controller/leadAssistantScheduleResolve.test.ts', () => {
  it('should normalize schedule fields and persist them on the session', async () => {
    const service = new LeadAssistantScheduleResolveService();

    let patchedPayload: any = null;
    (service as any).leadAssistantSessionService = {
      async patchSession(id: string, departmentId: number, patch: Record<string, any>) {
        patchedPayload = { id, departmentId, ...patch };
        return patchedPayload;
      },
    };

    const result = await service.resolveSchedule('session-1', 1, {
      pickupAddress: ' 12 Smith St, Parramatta NSW ',
      pickupAddressLat: ' -33.8136 ',
      pickupAddressLng: ' 151.0034 ',
      pickupAddressState: ' nsw ',
      pickupAddressPostcode: ' 2150 ',
      pickupPlaceId: ' ChIJ12345 ',
      expectedDate: ' 2026-04-20 ',
      tempDriverId: ' 42 ',
      tempDuration: ' 1.5 ',
      tempScheduledTime: ' 09:30 ',
    });

    expect(result.scheduleResolution.pickupAddress).toBe('12 Smith St, Parramatta NSW');
    expect(result.scheduleResolution.pickupAddressLat).toBe(-33.8136);
    expect(result.scheduleResolution.pickupAddressLng).toBe(151.0034);
    expect(result.scheduleResolution.pickupAddressState).toBe('NSW');
    expect(result.scheduleResolution.pickupAddressPostcode).toBe('2150');
    expect(result.scheduleResolution.pickupPlaceId).toBe('ChIJ12345');
    expect(result.scheduleResolution.expectedDate).toBe(String(Date.parse('2026-04-20')));
    expect(result.scheduleResolution.tempDriverId).toBe(42);
    expect(result.scheduleResolution.tempDuration).toBe(1.5);
    expect(result.scheduleResolution.tempScheduledTime).toBe('09:30');
    expect(patchedPayload.scheduleResolution.pickupAddressState).toBe('NSW');
  });
});
