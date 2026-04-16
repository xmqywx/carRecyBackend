import { Inject, Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { DeepseekService } from '../../ai/service/deepseek';
import { VolcArkService } from '../../ai/service/volcArk';
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
  volcArkService: VolcArkService;

  @Inject()
  leadAssistantSessionService: LeadAssistantSessionService;

  private buildSystemPrompt() {
    return [
      'You extract a lead intake draft for a car recycling yard.',
      'Return only valid JSON.',
      'Do not invent customer, vehicle, address, or timing facts.',
      'Use null or empty strings for missing fields.',
      'For isDrivable: set to 0 if vehicle is described as not drivable/broken/damaged/non-running, otherwise 1.',
      'For notDrivableReason: must be exactly one of: "engine", "transmission", "damage", "unknown". Pick the best match from the description. Only set this if isDrivable is 0.',
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
          isDrivable: 1,
          notDrivableReason: '',
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
        isDrivable: vehicle.isDrivable === 0 || vehicle.isDrivable === '0' ? 0 : 1,
        notDrivableReason: cleanText(vehicle.notDrivableReason),
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

  private buildImageSystemPrompt() {
    return [
      'You are a data extraction assistant for an Australian car recycling yard (Apexpoint).',
      'Extract structured lead intake details from the provided image.',
      'The image may show a handwritten note, a printed form, a whiteboard, a business card, or a vehicle licence plate.',
      'Return ONLY valid JSON matching this exact schema — no commentary, no markdown fences:',
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
      '',
      'Australian-specific rules:',
      '- Vehicle registration plates: typically 3 letters + 3 digits (e.g. "ABC123") or state-specific formats.',
      '- State codes: NSW, VIC, QLD, SA, WA, TAS, NT, ACT.',
      '- Phone numbers: Australian mobile numbers start with 04, landlines with 02/03/07/08.',
      '- If you read a rego from a plate image, put it in vehicle.rego (uppercase, no spaces).',
      '',
      'Handwriting rules:',
      '- Read cursive carefully; if uncertain, include your best guess and note uncertainty in notes.freeform.',
      '- Distinguish 0 vs O, 1 vs I vs l, 5 vs S in rego plates.',
      '',
      'Failure modes:',
      '- If the image is not an intake document or vehicle plate, set all fields to null/empty.',
      '- If no fields can be reliably extracted, return the schema with all nulls/empty strings.',
      '- Never invent data that is not visible in the image.',
      '- Do not invent customer, vehicle, address, or timing facts.',
      '- Use null or empty strings for any field not visible in the image.',
    ].join('\n');
  }

  async runImage(sessionId: string, departmentId: number, imageBase64: string) {
    const systemPrompt = this.buildImageSystemPrompt();
    const userText = 'Extract structured lead intake details from this image. Return JSON only.';

    const raw = await this.volcArkService.chatJsonWithImage(systemPrompt, userText, imageBase64);

    if (raw.__refusal) {
      const refusalMsg = typeof raw.message === 'string' ? raw.message : 'The AI refused to process this image.';
      // Store the refusal message in notes.freeform so it surfaces in the UI without
      // requiring a schema change to LeadAssistantSession.
      return await this.leadAssistantSessionService.patchSession(sessionId, departmentId, {
        status: 'error',
        extractedDraft: {
          customer: { fullName: '', firstName: '', surname: '', phone: '', email: '' },
          vehicle: { rego: '', vin: '', state: '', brand: '', model: '', year: null, colour: '' },
          schedule: { pickupAddressText: '', preferredTimeText: '', floating: null },
          money: { askingPrice: null, quoteType: '' },
          notes: { rawIntake: '', vehicleCondition: '', freeform: refusalMsg },
        },
      });
    }

    const extractedDraft = this.normalizeDraft(raw, '');

    return await this.leadAssistantSessionService.patchSession(
      sessionId,
      departmentId,
      {
        extractedDraft,
        status: 'drafted',
      }
    );
  }
}
