import { Inject, Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { CarEntity } from '../../car/entity/base';
import { CarRegEntity } from '../../carReg/entity/info';
import { BaseSysVehicleEntity } from '../../base/entity/sys/vehicle';
import { OrderService } from '../../order/service/order';
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
export class LeadAssistantVehicleResolveService extends BaseService {
  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;

  @InjectEntityModel(CarRegEntity)
  carRegEntity: Repository<CarRegEntity>;

  @InjectEntityModel(BaseSysVehicleEntity)
  baseSysVehicleEntity: Repository<BaseSysVehicleEntity>;

  @Inject()
  orderService: OrderService;

  @Inject()
  leadAssistantSessionService: LeadAssistantSessionService;

  private buildVehicleLabel(input: {
    brand?: string;
    model?: string;
    year?: number | null;
    series?: string;
    rego?: string;
  }) {
    const main = [input.year, input.brand, input.model].filter(Boolean).join(' ');
    const suffix = [input.series, input.rego].filter(Boolean).join(' · ');
    return [main, suffix].filter(Boolean).join(' · ');
  }

  private normalizeExistingVehicle(car: Record<string, any>) {
    return {
      id: car.id,
      source: 'existing',
      rego: cleanText(car.registrationNumber).toUpperCase(),
      vin: cleanText(car.vinNumber).toUpperCase(),
      state: cleanText(car.state).toUpperCase(),
      brand: cleanText(car.brand),
      model: cleanText(car.model),
      year: toNumber(car.year),
      colour: cleanText(car.colour),
      label: this.buildVehicleLabel({
        brand: car.brand,
        model: car.model,
        year: toNumber(car.year),
        rego: cleanText(car.registrationNumber).toUpperCase(),
      }),
      recommendedAction: 'use-existing',
    };
  }

  private normalizeRegistryVehicle(raw: Record<string, any>) {
    const identification = raw?.identification || {};
    const details = raw?.details || {};
    return {
      source: 'registry',
      rego: cleanText(identification.plate).toUpperCase(),
      vin: cleanText(identification.vin).toUpperCase(),
      state: cleanText(identification.state).toUpperCase(),
      brand: cleanText(details.make),
      model: cleanText(details.model),
      year: toNumber(details.year),
      colour: cleanText(details.colour),
      label: this.buildVehicleLabel({
        brand: details.make,
        model: details.model,
        year: toNumber(details.year),
        rego: cleanText(identification.plate).toUpperCase(),
      }),
      recommendedAction: 'use-lookup',
      raw,
    };
  }

  private normalizeVehicleDbCandidate(row: Record<string, any>) {
    return {
      id: row.id,
      source: 'vehicle-db',
      brand: cleanText(row.brand),
      model: cleanText(row.model),
      year: toNumber(row.year),
      series: cleanText(row.series),
      label: this.buildVehicleLabel({
        brand: row.brand,
        model: row.model,
        year: toNumber(row.year),
        series: cleanText(row.series),
      }),
      recommendedAction: 'refine',
    };
  }

  private async lookupRegistryVehicle(input: {
    rego?: string;
    state?: string;
    vin?: string;
  }) {
    const rego = cleanText(input.rego).toUpperCase();
    const state = cleanText(input.state).toUpperCase();
    const vin = cleanText(input.vin).toUpperCase();

    if (!rego && !vin) return null;

    const cached = await this.carRegEntity.findOne({
      registrationNumber: rego || '',
      state: state || '',
      vin: vin || '',
    } as any);

    if (cached?.json_v2) {
      return cached.json_v2;
    }

    const response = await this.orderService.fetchDataWithV2(rego, state, vin);
    return response?.result?.vehicle ?? null;
  }

  async resolveCandidates(
    sessionId: string,
    departmentId: number,
    draftVehicle: {
      rego?: string;
      vin?: string;
      state?: string;
      brand?: string;
      model?: string;
      year?: number | null;
    }
  ) {
    const rego = cleanText(draftVehicle.rego).toUpperCase();
    const vin = cleanText(draftVehicle.vin).toUpperCase();
    const state = cleanText(draftVehicle.state).toUpperCase();
    const brand = cleanText(draftVehicle.brand);
    const model = cleanText(draftVehicle.model);
    const year = toNumber(draftVehicle.year);

    let existingCars: any[] = [];
    if (rego || vin) {
      existingCars = await this.carEntity.find({
        where: {
          departmentId,
          ...(rego ? { registrationNumber: rego } : {}),
          ...(state ? { state } : {}),
          ...(vin ? { vinNumber: vin } : {}),
        },
        take: 10,
      } as any);
    }

    if (!existingCars.length && brand && model) {
      existingCars = await this.carEntity.find({
        where: {
          departmentId,
          brand,
          model,
          ...(year ? { year } : {}),
        },
        take: 10,
      } as any);
    }

    const registryCandidate = await this.lookupRegistryVehicle({ rego, state, vin });

    const vehicleDbCandidates = brand
      ? await this.baseSysVehicleEntity
          .createQueryBuilder('v')
          .where('v.brand = :brand', { brand })
          .andWhere(model ? 'v.model LIKE :model' : '1=1', { model: `%${model}%` })
          .andWhere(year ? 'v.year = :year' : '1=1', { year })
          .take(12)
          .getMany()
      : [];

    const result = {
      existingVehicles: existingCars.map(car => this.normalizeExistingVehicle(car)),
      registryLookup: registryCandidate ? [this.normalizeRegistryVehicle(registryCandidate)] : [],
      vehicleDbCandidates: vehicleDbCandidates.map(row => this.normalizeVehicleDbCandidate(row)),
      requiresRefinement: !rego && !vin && vehicleDbCandidates.length > 1,
    };

    return await this.leadAssistantSessionService.patchSession(sessionId, departmentId, {
      vehicleResolution: result,
    });
  }

  async selectResolution(
    sessionId: string,
    departmentId: number,
    payload: {
      selectedSource: 'existing' | 'registry' | 'vehicle-db' | 'new';
      selectedVehicleId?: number;
      selectedLookupPayload?: Record<string, any>;
    }
  ) {
    const session = await this.leadAssistantSessionService.getSession(
      sessionId,
      departmentId
    );

    return await this.leadAssistantSessionService.patchSession(sessionId, departmentId, {
      vehicleResolution: {
        ...(session.vehicleResolution || {}),
        selectedSource: payload.selectedSource,
        selectedVehicleId: payload.selectedVehicleId || null,
        selectedLookupPayload: payload.selectedLookupPayload || null,
      },
      status: 'vehicle_resolved',
    });
  }
}
