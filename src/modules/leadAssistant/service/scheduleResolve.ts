import { Inject, Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { LeadAssistantSessionService } from './session';

function cleanText(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function toNumber(value: unknown) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeExpectedDate(value: unknown) {
  const raw = cleanText(value);
  if (!raw) return '';
  if (/^\d+$/.test(raw)) return raw;

  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? raw : String(parsed);
}

@Provide()
export class LeadAssistantScheduleResolveService extends BaseService {
  @Inject()
  leadAssistantSessionService: LeadAssistantSessionService;

  private normalizeScheduleResolution(draftSchedule: Record<string, any>) {
    const pickupAddress = cleanText(draftSchedule.pickupAddress);
    const pickupAddressLat = toNumber(draftSchedule.pickupAddressLat);
    const pickupAddressLng = toNumber(draftSchedule.pickupAddressLng);
    const pickupAddressState = cleanText(draftSchedule.pickupAddressState).toUpperCase();
    const pickupAddressPostcode = cleanText(draftSchedule.pickupAddressPostcode);
    const pickupPlaceId = cleanText(draftSchedule.pickupPlaceId);
    const expectedDate = normalizeExpectedDate(draftSchedule.expectedDate);
    const tempDriverId = toNumber(draftSchedule.tempDriverId);
    const tempDuration = toNumber(draftSchedule.tempDuration);
    const tempScheduledTime = cleanText(draftSchedule.tempScheduledTime);

    return {
      ...(pickupAddress ? { pickupAddress } : {}),
      ...(pickupAddressLat !== null ? { pickupAddressLat } : {}),
      ...(pickupAddressLng !== null ? { pickupAddressLng } : {}),
      ...(pickupAddressState ? { pickupAddressState } : {}),
      ...(pickupAddressPostcode ? { pickupAddressPostcode } : {}),
      ...(pickupPlaceId ? { pickupPlaceId } : {}),
      ...(expectedDate ? { expectedDate } : {}),
      ...(tempDriverId !== null ? { tempDriverId } : {}),
      ...(tempDuration !== null ? { tempDuration } : {}),
      ...(tempScheduledTime ? { tempScheduledTime } : {}),
    };
  }

  async resolveSchedule(
    sessionId: string,
    departmentId: number,
    draftSchedule: Record<string, any>
  ) {
    const scheduleResolution = this.normalizeScheduleResolution(draftSchedule || {});

    return await this.leadAssistantSessionService.patchSession(sessionId, departmentId, {
      scheduleResolution,
    });
  }
}
