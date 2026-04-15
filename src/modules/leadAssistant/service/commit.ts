import { Inject, Provide } from '@midwayjs/decorator';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository, getConnection } from 'typeorm';
import { BaseSysVehicleEntity } from '../../base/entity/sys/vehicle';
import { CarEntity } from '../../car/entity/base';
import { CustomerProfileEntity } from '../../customer/entity/profile';
import { OrderActionEntity } from '../../order/entity/action';
import { OrderInfoEntity } from '../../order/entity/info';
import { LeadAssistantSessionService } from './session';

function cleanText(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function cleanUpper(value: unknown) {
  return cleanText(value).toUpperCase();
}

function toNumber(value: unknown) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function splitName(input: {
  fullName?: string;
  firstName?: string;
  surname?: string;
}) {
  const firstName = cleanText(input.firstName);
  const surname = cleanText(input.surname);
  if (firstName || surname) {
    return { firstName, surname };
  }
  const fullName = cleanText(input.fullName);
  if (!fullName) {
    return { firstName: '', surname: '' };
  }
  const parts = fullName.split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    surname: parts.slice(1).join(' '),
  };
}

function buildQuotePrefix(name: string) {
  return cleanText(name)
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word[0].toUpperCase())
    .join('');
}

@Provide()
export class LeadAssistantCommitService extends BaseService {
  @InjectEntityModel(CustomerProfileEntity)
  customerProfileEntity: Repository<CustomerProfileEntity>;

  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;

  @InjectEntityModel(BaseSysVehicleEntity)
  baseSysVehicleEntity: Repository<BaseSysVehicleEntity>;

  @InjectEntityModel(OrderInfoEntity)
  orderInfoEntity: Repository<OrderInfoEntity>;

  @InjectEntityModel(OrderActionEntity)
  orderActionEntity: Repository<OrderActionEntity>;

  @Inject()
  leadAssistantSessionService: LeadAssistantSessionService;

  @Inject()
  ctx;

  private async resolveCustomer(
    manager: any,
    session: Record<string, any>,
    departmentId: number
  ) {
    const customerDraft = session.extractedDraft?.customer || {};
    const customerResolution = session.customerResolution || {};
    const selectedMode = cleanText(customerResolution.selectedMode);
    const updateMode = cleanText(customerResolution.updateMode) || 'none';
    const { firstName, surname } = splitName(customerDraft);

    if (!selectedMode) {
      throw new CoolCommException('Customer must be resolved before committing a lead.');
    }

    const customerRepo = manager.getRepository(CustomerProfileEntity);

    if (selectedMode === 'create-new') {
      return await customerRepo.save({
        firstName: firstName || 'Unknown',
        surname,
        phoneNumber: cleanText(customerDraft.phone),
        emailAddress: cleanText(customerDraft.email),
        address: cleanText(session.scheduleResolution?.pickupAddress),
        customerAt: 'Private',
        departmentId,
        isDel: false,
      });
    }

    const selectedCustomerId = toNumber(customerResolution.selectedCustomerId);
    if (!selectedCustomerId) {
      throw new CoolCommException('Existing customer selection is missing.');
    }

    const customer = await customerRepo.findOne({
      id: selectedCustomerId,
      departmentId,
      isDel: false,
    } as any);

    if (!customer) {
      throw new CoolCommException('Selected customer could not be found.');
    }

    if (updateMode === 'missing-fields-only') {
      await customerRepo.save({
        id: customer.id,
        firstName: customer.firstName || firstName,
        surname: customer.surname || surname,
        phoneNumber: customer.phoneNumber || cleanText(customerDraft.phone),
        emailAddress: customer.emailAddress || cleanText(customerDraft.email),
        address:
          customer.address || cleanText(session.scheduleResolution?.pickupAddress),
      });
      return await customerRepo.findOne(customer.id);
    }

    return customer;
  }

  private mapRegistryPayload(payload: Record<string, any>) {
    const identification = payload?.identification || {};
    const details = payload?.details || {};
    return {
      registrationNumber: cleanUpper(identification.plate || payload?.rego),
      vinNumber: cleanUpper(identification.vin || payload?.vin),
      state: cleanUpper(identification.state || payload?.state),
      brand: cleanText(details.make || payload?.brand),
      model: cleanText(details.model || payload?.model),
      year: toNumber(details.year ?? payload?.year),
      colour: cleanText(details.colour || payload?.colour),
      series: cleanText(details.series || payload?.series),
      bodyStyle: cleanText(details.bodyStyle || payload?.bodyStyle),
      engine: cleanText(details.engine || payload?.engine),
      engineCode: cleanText(details.engineCode || payload?.engineCode),
      engineNumber: cleanText(details.engineNumber || payload?.engineNumber),
      transmission: cleanText(details.transmission || payload?.transmission),
      fuel: cleanText(details.fuel || payload?.fuel),
      power: cleanText(details.power || payload?.power),
      cylinders: toNumber(details.cylinders ?? payload?.cylinders),
    };
  }

  private async resolveVehicle(
    manager: any,
    session: Record<string, any>,
    departmentId: number,
    customerId: number
  ) {
    const vehicleDraft = session.extractedDraft?.vehicle || {};
    const vehicleResolution = session.vehicleResolution || {};
    const selectedSource = cleanText(vehicleResolution.selectedSource);

    if (!selectedSource) {
      throw new CoolCommException('Vehicle must be resolved before committing a lead.');
    }

    const carRepo = manager.getRepository(CarEntity);

    if (selectedSource === 'existing') {
      const selectedVehicleId = toNumber(vehicleResolution.selectedVehicleId);
      if (!selectedVehicleId) {
        throw new CoolCommException('Existing vehicle selection is missing.');
      }
      const existingCar = await carRepo.findOne({
        id: selectedVehicleId,
        departmentId,
      } as any);
      if (!existingCar) {
        throw new CoolCommException('Selected vehicle could not be found.');
      }
      if (existingCar.customerID && Number(existingCar.customerID) !== Number(customerId)) {
        throw new CoolCommException(
          'Selected vehicle belongs to a different customer and needs manual review.'
        );
      }
      return existingCar;
    }

    let vehicleSeed: Record<string, any> = {
      registrationNumber: cleanUpper(vehicleDraft.rego),
      vinNumber: cleanUpper(vehicleDraft.vin),
      state: cleanUpper(vehicleDraft.state),
      brand: cleanText(vehicleDraft.brand),
      model: cleanText(vehicleDraft.model),
      year: toNumber(vehicleDraft.year),
      colour: cleanText(vehicleDraft.colour),
    };

    if (selectedSource === 'registry') {
      vehicleSeed = {
        ...vehicleSeed,
        ...this.mapRegistryPayload(vehicleResolution.selectedLookupPayload || {}),
      };
    }

    if (selectedSource === 'vehicle-db') {
      const selectedVehicleId = toNumber(vehicleResolution.selectedVehicleId);
      const dbCandidate =
        selectedVehicleId &&
        (await manager
          .getRepository(BaseSysVehicleEntity)
          .findOne({ id: selectedVehicleId } as any));
      const payload = dbCandidate || vehicleResolution.selectedLookupPayload || {};
      vehicleSeed = {
        ...vehicleSeed,
        brand: cleanText(payload.brand || vehicleSeed.brand),
        model: cleanText(payload.model || vehicleSeed.model),
        year: toNumber(payload.year ?? vehicleSeed.year),
        series: cleanText(payload.series),
        bodyStyle: cleanText(payload.bodyStyle),
        cylinders: toNumber(payload.cylinders),
      };
    }

    const name = [
      vehicleSeed.year,
      vehicleSeed.brand,
      vehicleSeed.model,
    ]
      .filter(Boolean)
      .join(' ');

    return await carRepo.save({
      customerID: customerId,
      departmentId,
      name,
      year: vehicleSeed.year,
      brand: vehicleSeed.brand,
      model: vehicleSeed.model,
      colour: vehicleSeed.colour,
      registrationNumber: vehicleSeed.registrationNumber,
      state: vehicleSeed.state,
      vinNumber: vehicleSeed.vinNumber,
      series: cleanText(vehicleSeed.series),
      bodyStyle: cleanText(vehicleSeed.bodyStyle),
      engine: cleanText(vehicleSeed.engine),
      engineCode: cleanText(vehicleSeed.engineCode),
      engineNumber: cleanText(vehicleSeed.engineNumber),
      transmission: cleanText(vehicleSeed.transmission),
      fuel: cleanText(vehicleSeed.fuel),
      power: cleanText(vehicleSeed.power),
      cylinders: toNumber(vehicleSeed.cylinders),
      carInfo: cleanText(session.extractedDraft?.notes?.vehicleCondition),
      status: 1,
    });
  }

  async commitLead(
    sessionId: string,
    departmentId: number,
    payload?: { continueAsNew?: boolean }
  ) {
    const session = await this.leadAssistantSessionService.getSession(
      sessionId,
      departmentId
    );

    if (!session?.extractedDraft) {
      throw new CoolCommException('Lead draft is missing.');
    }

    if (
      session.duplicateCheck?.hasDuplicates &&
      !payload?.continueAsNew
    ) {
      throw new CoolCommException(
        'Potential duplicates found. Review duplicates before committing the lead.'
      );
    }

    const pickupAddress = cleanText(session.scheduleResolution?.pickupAddress);
    if (!pickupAddress) {
      throw new CoolCommException('Pickup address must be confirmed before committing a lead.');
    }

    const conn = getConnection();
    const created = await conn.transaction(async manager => {
      const customer = await this.resolveCustomer(manager, session, departmentId);
      const car = await this.resolveVehicle(
        manager,
        session,
        departmentId,
        customer.id
      );

      const orderRepo = manager.getRepository(OrderInfoEntity);
      const orderActionRepo = manager.getRepository(OrderActionEntity);
      const notes = session.extractedDraft.notes || {};
      const money = session.extractedDraft.money || {};
      const schedule = session.scheduleResolution || {};

      const order = await orderRepo.save({
        customerID: String(customer.id),
        carID: car.id,
        departmentId,
        status: 0,
        pickupAddress,
        pickupAddressState: cleanUpper(schedule.pickupAddressState),
        pickupAddressLat:
          schedule.pickupAddressLat === undefined ||
          schedule.pickupAddressLat === null
            ? null
            : String(schedule.pickupAddressLat),
        pickupAddressLng:
          schedule.pickupAddressLng === undefined ||
          schedule.pickupAddressLng === null
            ? null
            : String(schedule.pickupAddressLng),
        expectedDate:
          cleanText(schedule.expectedDate) ||
          cleanText(session.extractedDraft.schedule?.preferredTimeText),
        askingPrice: toNumber(money.askingPrice),
        quoteType: cleanText(money.quoteType) || 'Fixed',
        customerName: [customer.firstName, customer.surname]
          .filter(Boolean)
          .join(' '),
        carColor: cleanText(car.colour),
        commentText: cleanText(notes.freeform || notes.vehicleCondition),
        note: cleanText(notes.rawIntake || session.intakeText),
        source: 'lead-assistant',
        leadSource: 'AI',
        leadSourceDetail: 'Lead Creation Copilot',
      });

      const departmentRows = await manager.query(
        'SELECT name FROM `base_sys_department` WHERE id = ? LIMIT 1',
        [departmentId]
      );
      const quotePrefix = buildQuotePrefix(departmentRows?.[0]?.name || 'AP');
      order.quoteNumber = `${quotePrefix}${order.id
        .toString()
        .padStart(7, '0')}`;
      await orderRepo.save(order);

      await orderActionRepo.save({
        timestamp: String(Date.now()),
        name: 'Lead Creation Copilot',
        description: 'Created lead via strict lead assistant flow',
        authorID: this.ctx.admin?.userId || 0,
        orderID: order.id,
        type: 0,
      });

      return {
        orderID: order.id,
        quoteNumber: order.quoteNumber,
        customerID: customer.id,
        carID: car.id,
        status: order.status,
      };
    });

    return await this.leadAssistantSessionService.patchSession(sessionId, departmentId, {
      commitPreview: created,
      status: 'lead_committed',
    });
  }
}
