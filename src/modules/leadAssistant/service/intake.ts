import { Inject, Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { DeepseekService } from '../../ai/service/deepseek';
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

@Provide()
export class LeadAssistantIntakeService extends BaseService {
  @Inject()
  deepseekService: DeepseekService;

  @Inject()
  leadAssistantSessionService: LeadAssistantSessionService;

  private buildSystemPrompt() {
    return [
      'You extract a lead intake draft for a car recycling yard.',
      'Return only valid JSON.',
      'Do not invent customer, vehicle, address, or timing facts.',
      'Use null or empty strings for missing fields.',
      'Use this schema:',
      JSON.stringify({
        customer: {
          fullName: '',
          firstName: '',
          surname: '',
          phone: '',
          email: '',
        },
        vehicle: {
          rego: '',
          vin: '',
          state: '',
          brand: '',
          model: '',
          year: null,
          colour: '',
        },
        schedule: {
          pickupAddressText: '',
          preferredTimeText: '',
          floating: null,
        },
        money: {
          askingPrice: null,
          quoteType: '',
        },
        notes: {
          rawIntake: '',
          vehicleCondition: '',
          freeform: '',
        },
      }),
    ].join('\n');
  }

  private normalizeDraft(raw: Record<string, any>, intakeText: string) {
    const customer = raw?.customer || {};
    const vehicle = raw?.vehicle || {};
    const schedule = raw?.schedule || {};
    const money = raw?.money || {};
    const notes = raw?.notes || {};

    return {
      customer: {
        fullName: cleanText(customer.fullName),
        firstName: cleanText(customer.firstName),
        surname: cleanText(customer.surname),
        phone: cleanText(customer.phone),
        email: cleanText(customer.email),
      },
      vehicle: {
        rego: cleanText(vehicle.rego).toUpperCase(),
        vin: cleanText(vehicle.vin).toUpperCase(),
        state: cleanText(vehicle.state).toUpperCase(),
        brand: cleanText(vehicle.brand),
        model: cleanText(vehicle.model),
        year: toNumber(vehicle.year),
        colour: cleanText(vehicle.colour),
      },
      schedule: {
        pickupAddressText: cleanText(schedule.pickupAddressText),
        preferredTimeText: cleanText(schedule.preferredTimeText),
        floating:
          typeof schedule.floating === 'boolean'
            ? schedule.floating
            : schedule.floating === null || schedule.floating === undefined
              ? null
              : String(schedule.floating).toLowerCase() === 'true',
      },
      money: {
        askingPrice: toNumber(money.askingPrice),
        quoteType: cleanText(money.quoteType),
      },
      notes: {
        rawIntake: cleanText(notes.rawIntake) || intakeText,
        vehicleCondition: cleanText(notes.vehicleCondition),
        freeform: cleanText(notes.freeform),
      },
    };
  }

  async run(sessionId: string, departmentId: number, intakeText: string) {
    const extractedDraft = this.normalizeDraft(
      await this.deepseekService.chatJson(this.buildSystemPrompt(), intakeText),
      intakeText
    );

    return await this.leadAssistantSessionService.patchSession(
      sessionId,
      departmentId,
      {
        intakeText,
        extractedDraft,
        status: 'drafted',
      }
    );
  }
}
