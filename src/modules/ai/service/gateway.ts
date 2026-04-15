import { Provide, Inject } from '@midwayjs/decorator';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { CustomerProfileEntity } from '../../customer/entity/profile';
import { CarEntity } from '../../car/entity/base';
import { OrderInfoEntity } from '../../order/entity/info';
import { JobEntity } from '../../job/entity/info';
import { OrderActionEntity } from '../../order/entity/action';
import { PartsInventoryEntity } from '../../car/entity/partsInventory';
import { PartsVehicleEntity } from '../../car/entity/partsVehicle';
import { VehicleProcessingEntity } from '../../car/entity/vehicleProcessing';
import { OrderService } from '../../order/service/order';
import { DeepseekService } from './deepseek';

function cleanText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function splitCustomerName(value: string) {
  const parts = cleanText(value)
    .split(/\s+/)
    .filter(Boolean);
  return {
    firstName: parts[0] || '',
    surname: parts.slice(1).join(' '),
  };
}

function inferExpectedDate(value: string) {
  const raw = cleanText(value);
  if (!raw) return null;
  if (/^\d+$/.test(raw)) return raw;

  const lower = raw.toLowerCase();
  const date = new Date();
  if (lower.includes('tomorrow')) {
    date.setDate(date.getDate() + 1);
  }
  if (lower.includes('afternoon') || lower.includes('arvo')) {
    date.setHours(15, 0, 0, 0);
  } else if (lower.includes('morning')) {
    date.setHours(9, 0, 0, 0);
  } else {
    date.setHours(10, 0, 0, 0);
  }

  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) {
    return String(parsed);
  }
  return String(date.getTime());
}

function formatExpectedDateLabel(value: string) {
  const raw = cleanText(value);
  if (!raw) return '';
  if (/^\d+$/.test(raw)) {
    return new Date(Number(raw)).toLocaleString();
  }
  return raw;
}

function inferDayRange(prompt: string) {
  const lower = cleanText(prompt).toLowerCase();
  const date = new Date();

  if (lower.includes('tomorrow') || lower.includes('明天')) {
    date.setDate(date.getDate() + 1);
  } else if (!(lower.includes('today') || lower.includes('今天'))) {
    return null;
  }

  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return {
    label: lower.includes('tomorrow') || lower.includes('明天') ? 'Tomorrow' : 'Today',
    start: String(start.getTime()),
    end: String(end.getTime()),
  };
}

function hasIdentifierAnchor(prompt: string) {
  const upper = cleanText(prompt).toUpperCase();
  return (
    /\b[A-Z0-9]{5,8}\b/.test(upper) ||
    /\b[A-Z]{1,5}-?\d{3,}\b/.test(upper) ||
    /\b[A-HJ-NPR-Z0-9]{11,17}\b/.test(upper)
  );
}

function detectIntent(prompt: string, entryPoint: 'search' | 'create' = 'search') {
  if (entryPoint === 'create') {
    return 'booking_create_draft';
  }
  const lower = prompt.toLowerCase();
  if (/without driver|without drivers|no driver|unassigned|not assigned|未派司机/.test(lower)) {
    return 'operations_filter_query';
  }
  if (/how many|parts|unsold|sold count|parts left|零件/.test(lower)) {
    return 'vehicle_parts_summary';
  }
  if (/where|status|stage|what happened|decision|processing|arrived|在哪|状态/.test(lower)) {
    return 'vehicle_status_query';
  }
  if (hasIdentifierAnchor(prompt)) {
    return 'vehicle_status_query';
  }
  return 'booking_create_draft';
}

@Provide()
export class AiGatewayService extends BaseService {
  @InjectEntityModel(CustomerProfileEntity)
  customerProfileEntity: Repository<CustomerProfileEntity>;

  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;

  @InjectEntityModel(OrderInfoEntity)
  orderInfoEntity: Repository<OrderInfoEntity>;

  @InjectEntityModel(JobEntity)
  jobEntity: Repository<JobEntity>;

  @InjectEntityModel(OrderActionEntity)
  orderActionEntity: Repository<OrderActionEntity>;

  @InjectEntityModel(PartsInventoryEntity)
  partsInventoryEntity: Repository<PartsInventoryEntity>;

  @InjectEntityModel(PartsVehicleEntity)
  partsVehicleEntity: Repository<PartsVehicleEntity>;

  @InjectEntityModel(VehicleProcessingEntity)
  vehicleProcessingEntity: Repository<VehicleProcessingEntity>;

  @Inject()
  orderService: OrderService;

  @Inject()
  deepseekService: DeepseekService;

  @Inject()
  ctx;

  private extractAnchors(prompt: string) {
    const upper = prompt.toUpperCase();
    const regoMatch = upper.match(/\b[A-Z0-9]{5,8}\b/g) || [];
    const rego = regoMatch.find(token => /[A-Z]/.test(token) && /\d/.test(token)) || '';
    const stockMatch = upper.match(/\b[A-Z]{1,5}-?\d{3,}\b/g) || [];
    const vinMatch = upper.match(/\b[A-HJ-NPR-Z0-9]{11,17}\b/g) || [];
    return {
      rego,
      stockNumber: stockMatch[0] || '',
      vinNumber: vinMatch.find(token => token.length >= 11) || '',
    };
  }

  private async findOrderCandidates(prompt: string, departmentId?: number, limit = 5) {
    const anchors = this.extractAnchors(prompt);
    const qb = this.orderInfoEntity
      .createQueryBuilder('o')
      .leftJoin(CustomerProfileEntity, 'customer', 'o.customerID = customer.id')
      .leftJoin(CarEntity, 'car', 'o.carID = car.id')
      .leftJoin(JobEntity, 'job', 'job.orderID = o.id')
      .leftJoin(VehicleProcessingEntity, 'processing', 'processing.carID = car.id')
      .leftJoin(PartsVehicleEntity, 'partsVehicle', 'partsVehicle.carID = car.id')
      .select([
        'o.id as orderID',
        'o.status as order_status',
        'o.quoteNumber as quoteNumber',
        'o.pickupAddress as pickupAddress',
        'o.expectedDate as expectedDate',
        'o.commentText as commentText',
        'o.actualPaymentPrice as actualPaymentPrice',
        'customer.firstName as firstName',
        'customer.surname as surname',
        'customer.phoneNumber as phoneNumber',
        'car.id as carID',
        'car.name as name',
        'car.brand as brand',
        'car.model as model',
        'car.year as year',
        'car.registrationNumber as registrationNumber',
        'car.state as state',
        'car.vinNumber as vinNumber',
        'job.status as job_status',
        'processing.stage as processingStage',
        'processing.destination as destination',
        'partsVehicle.partsCount as partsCount',
        'partsVehicle.partsSold as partsSold',
      ])
      .orderBy('o.createTime', 'DESC')
      .limit(limit);

    if (departmentId) {
      qb.andWhere('o.departmentId = :departmentId', { departmentId });
    }

    const conditions = [];
    const params = {};

    if (anchors.rego) {
      conditions.push('car.registrationNumber = :rego');
      params['rego'] = anchors.rego;
    }
    if (anchors.stockNumber) {
      conditions.push('o.quoteNumber = :stockNumber');
      params['stockNumber'] = anchors.stockNumber;
    }
    if (anchors.vinNumber) {
      conditions.push('car.vinNumber = :vinNumber');
      params['vinNumber'] = anchors.vinNumber;
    }

    if (!conditions.length) {
      const words = cleanText(prompt).split(/\s+/).filter(Boolean).slice(0, 3);
      if (words.length) {
        const likeConditions = [];
        words.forEach((word, index) => {
          const key = `kw${index}`;
          params[key] = `%${word}%`;
          likeConditions.push(`car.name LIKE :${key}`);
          likeConditions.push(`customer.firstName LIKE :${key}`);
          likeConditions.push(`customer.surname LIKE :${key}`);
        });
        conditions.push(`(${likeConditions.join(' OR ')})`);
      }
    }

    if (conditions.length) {
      qb.andWhere(`(${conditions.join(' OR ')})`, params);
    }

    return qb.getRawMany();
  }

  private async buildOperationsResult(prompt: string, departmentId?: number) {
    const dayRange = inferDayRange(prompt);
    const qb = this.orderInfoEntity
      .createQueryBuilder('o')
      .leftJoin(CustomerProfileEntity, 'customer', 'o.customerID = customer.id')
      .leftJoin(CarEntity, 'car', 'o.carID = car.id')
      .leftJoin(JobEntity, 'job', 'job.orderID = o.id')
      .select([
        'o.id as orderID',
        'o.status as order_status',
        'o.quoteNumber as quoteNumber',
        'o.expectedDate as expectedDate',
        'o.pickupAddress as pickupAddress',
        'customer.firstName as firstName',
        'customer.surname as surname',
        'car.registrationNumber as registrationNumber',
        'car.brand as brand',
        'car.model as model',
        'car.year as year',
        'job.driverID as driverID',
      ])
      .where('o.status = :orderStatus', { orderStatus: 1 })
      .andWhere('(job.driverID IS NULL OR job.driverID = 0)')
      .orderBy('o.expectedDate', 'ASC')
      .limit(20);

    if (departmentId) {
      qb.andWhere('o.departmentId = :departmentId', { departmentId });
    }

    if (dayRange) {
      qb.andWhere('o.expectedDate >= :expectedDateStart', {
        expectedDateStart: dayRange.start,
      });
      qb.andWhere('o.expectedDate <= :expectedDateEnd', {
        expectedDateEnd: dayRange.end,
      });
    }

    const rows = await qb.getRawMany();
    return {
      interpret: {
        intent: 'operations_filter_query',
        confidence: 0.93,
        entities: {},
        filters: {
          status: 'booked',
          driverAssigned: false,
          dayRange: dayRange?.label || 'All',
        },
        missingRequired: [],
        ambiguities: [],
        suggestedTools: ['searchBookings'],
        responseMode: 'result',
      },
      mode: 'operations',
      operations: {
        title: 'Booked vehicles without drivers',
        subtitle: dayRange ? `${dayRange.label} bookings` : 'Open booked jobs with no assigned driver',
        count: rows.length,
        rows: rows.map(row => ({
          id: row.orderID,
          orderID: Number(row.orderID),
          stockNumber: row.quoteNumber,
          registrationNumber: row.registrationNumber,
          vehicleLabel: this.buildVehicleLabel(row),
          customerName: [row.firstName, row.surname].filter(Boolean).join(' '),
          bookingStatus: this.bookingStatusLabel(Number(row.order_status), 0),
          expectedDateLabel: formatExpectedDateLabel(row.expectedDate),
          pickupAddress: cleanText(row.pickupAddress),
          meta: 'No driver assigned',
        })),
      },
      source: 'live',
    };
  }

  private bookingStatusLabel(orderStatus: number, jobStatus: number) {
    if (orderStatus === 0) return 'Lead';
    if (orderStatus === 2) return 'Archived';
    if (orderStatus === 3) return 'Unsuccessful';
    if (orderStatus === 1 && jobStatus === 4) return 'Completed';
    if (orderStatus === 1) return 'Booked';
    return 'Lead';
  }

  private buildVehicleLabel(row) {
    return cleanText(row.name) || [row.year, row.brand, row.model].filter(Boolean).join(' ') || 'Unknown Vehicle';
  }

  private async buildPartsSummary(carID: number) {
    const raw = await this.partsInventoryEntity
      .createQueryBuilder('p')
      .select('COUNT(*)', 'total')
      .addSelect(`SUM(CASE WHEN p.status = 'sold' THEN 1 ELSE 0 END)`, 'sold')
      .addSelect(`SUM(CASE WHEN p.status = 'closed' THEN 1 ELSE 0 END)`, 'closed')
      .addSelect(`SUM(CASE WHEN p.status NOT IN ('sold', 'closed', 'void') THEN 1 ELSE 0 END)`, 'inventory')
      .addSelect('COALESCE(SUM(p.price), 0)', 'totalListedValue')
      .addSelect('COALESCE(SUM(p.soldPrice), 0)', 'totalSoldValue')
      .where('p.carID = :carID', { carID })
      .getRawOne();

    return {
      total: Number(raw?.total || 0),
      inventory: Number(raw?.inventory || 0),
      sold: Number(raw?.sold || 0),
      closed: Number(raw?.closed || 0),
      totalListedValue: Number(raw?.totalListedValue || 0),
      totalSoldValue: Number(raw?.totalSoldValue || 0),
    };
  }

  private buildDraftSections(mappedForm) {
    const field = (label, value, status) => ({
      label,
      value: cleanText(value) || 'Missing',
      status,
    });

    return [
      {
        key: 'customer',
        title: 'Customer',
        items: [
          field('First name', mappedForm.firstName, mappedForm.firstName ? 'confirmed' : 'missing'),
          field('Surname', mappedForm.surname, mappedForm.surname ? 'confirmed' : 'missing'),
          field('Phone', mappedForm.phoneNumber, mappedForm.phoneNumber ? 'confirmed' : 'missing'),
          field('Email', mappedForm.emailAddress, mappedForm.emailAddress ? 'inferred' : 'missing'),
        ],
      },
      {
        key: 'vehicle',
        title: 'Vehicle',
        items: [
          field('Rego', mappedForm.registrationNumber, mappedForm.registrationNumber ? 'confirmed' : 'missing'),
          field('State', mappedForm.state, mappedForm.state ? 'inferred' : 'missing'),
          field('Make', mappedForm.brand, mappedForm.brand ? 'confirmed' : 'missing'),
          field('Model', mappedForm.model, mappedForm.model ? 'confirmed' : 'missing'),
          field('Year', mappedForm.year, mappedForm.year ? 'inferred' : 'missing'),
        ],
      },
      {
        key: 'pickup',
        title: 'Pickup',
        items: [
          field('Address', mappedForm.pickupAddress, mappedForm.pickupAddress ? 'inferred' : 'missing'),
          field('Preferred time', mappedForm.expectedDate ? new Date(Number(mappedForm.expectedDate)).toLocaleString() : '', mappedForm.expectedDate ? 'inferred' : 'missing'),
        ],
      },
      {
        key: 'money',
        title: 'Money',
        items: [
          field('Quote', mappedForm.actualPaymentPrice ? `$${mappedForm.actualPaymentPrice}` : '', mappedForm.actualPaymentPrice ? 'inferred' : 'missing'),
          field('Pay method', mappedForm.payMethod, mappedForm.payMethod ? 'inferred' : 'missing'),
        ],
      },
    ];
  }

  private async buildDuplicateCandidates(mappedForm, departmentId?: number) {
    const qb = this.orderInfoEntity
      .createQueryBuilder('o')
      .leftJoin(CustomerProfileEntity, 'customer', 'o.customerID = customer.id')
      .leftJoin(CarEntity, 'car', 'o.carID = car.id')
      .select([
        'o.id as orderID',
        'o.status as order_status',
        'o.createTime as createTime',
        'o.quoteNumber as quoteNumber',
        'car.registrationNumber as registrationNumber',
        'car.brand as brand',
        'car.model as model',
        'car.year as year',
        'customer.firstName as firstName',
        'customer.surname as surname',
      ])
      .orderBy('o.createTime', 'DESC')
      .limit(3);

    if (departmentId) {
      qb.andWhere('o.departmentId = :departmentId', { departmentId });
    }

    const conditions = [];
    const params = {};
    if (mappedForm.phoneNumber) {
      conditions.push('customer.phoneNumber = :phoneNumber');
      params['phoneNumber'] = mappedForm.phoneNumber;
    }
    if (mappedForm.registrationNumber) {
      conditions.push('car.registrationNumber = :registrationNumber');
      params['registrationNumber'] = mappedForm.registrationNumber;
    }
    if (mappedForm.vinNumber) {
      conditions.push('car.vinNumber = :vinNumber');
      params['vinNumber'] = mappedForm.vinNumber;
    }

    if (!conditions.length) return [];

    qb.andWhere(`(${conditions.join(' OR ')})`, params);
    const rows = await qb.getRawMany();
    return rows.map(row => ({
      id: row.orderID,
      type: 'booking',
      title: `${row.quoteNumber || 'Existing booking'} · ${row.registrationNumber || [row.year, row.brand, row.model].filter(Boolean).join(' ') || 'Vehicle'}`,
      subtitle: [row.firstName, row.surname].filter(Boolean).join(' ') || 'Existing customer',
      meta: `${this.bookingStatusLabel(Number(row.order_status), -1)} · ${row.createTime}`,
      orderID: Number(row.orderID),
    }));
  }

  private async createDraftFromPrompt(prompt: string, departmentId?: number) {
    const aiExtract = await this.deepseekService.chatJson(
      [
        'You extract messy booking intake text into a strict JSON object.',
        'Return JSON only. No markdown.',
        'Schema:',
        '{',
        '  "customerName": string,',
        '  "firstName": string,',
        '  "surname": string,',
        '  "phoneNumber": string,',
        '  "emailAddress": string,',
        '  "registrationNumber": string,',
        '  "state": string,',
        '  "vinNumber": string,',
        '  "brand": string,',
        '  "model": string,',
        '  "year": number,',
        '  "colour": string,',
        '  "isDrivable": number,',
        '  "notDrivableReason": string,',
        '  "pickupAddress": string,',
        '  "pickupNotes": string,',
        '  "expectedDateText": string,',
        '  "actualPaymentPrice": number,',
        '  "payMethod": string,',
        '  "commentText": string,',
        '  "missingRequired": string[],',
        '  "ambiguities": string[]',
        '}',
        'Use empty string for unknown string fields, 1/0 for isDrivable when possible, and [] for missing arrays.',
      ].join('\n'),
      prompt
    );

    const splitName = splitCustomerName(aiExtract.customerName || '');
    const firstName = cleanText(aiExtract.firstName) || splitName.firstName;
    const surname = cleanText(aiExtract.surname) || splitName.surname;
    const mappedForm = {
      firstName,
      surname,
      phoneNumber: cleanText(aiExtract.phoneNumber),
      emailAddress: cleanText(aiExtract.emailAddress),
      registrationNumber: cleanText(aiExtract.registrationNumber).toUpperCase(),
      state: cleanText(aiExtract.state).toUpperCase(),
      vinNumber: cleanText(aiExtract.vinNumber).toUpperCase(),
      brand: cleanText(aiExtract.brand),
      model: cleanText(aiExtract.model),
      year: toNumber(aiExtract.year),
      colour: cleanText(aiExtract.colour),
      isDrivable: aiExtract.isDrivable === 0 ? 0 : 1,
      notDrivableReason: cleanText(aiExtract.notDrivableReason),
      pickupAddress: cleanText(aiExtract.pickupAddress),
      pickupNotes: cleanText(aiExtract.pickupNotes),
      expectedDate: inferExpectedDate(aiExtract.expectedDateText),
      actualPaymentPrice: toNumber(aiExtract.actualPaymentPrice),
      payMethod: cleanText(aiExtract.payMethod),
      commentText: cleanText(aiExtract.commentText) || cleanText(prompt),
      quoteType: 'Fixed',
    };

    const missingRequired: string[] = [];
    const ambiguities = Array.isArray(aiExtract.ambiguities)
      ? aiExtract.ambiguities.filter(Boolean)
      : [];
    if (!mappedForm.phoneNumber && ![mappedForm.firstName, mappedForm.surname].filter(Boolean).length) {
      missingRequired.push('customer contact');
    }
    if (!mappedForm.registrationNumber && !(mappedForm.brand && mappedForm.model)) {
      missingRequired.push('vehicle details');
    }
    if (!mappedForm.pickupAddress) {
      missingRequired.push('pickup address');
    }

    const duplicates = await this.buildDuplicateCandidates(mappedForm, departmentId);
    const dedupedMissing = Array.from(new Set(missingRequired));
    const dedupedAmbiguities = Array.from(new Set(ambiguities));

    return {
      interpret: {
        intent: 'booking_create_draft',
        confidence: 0.92,
        entities: mappedForm,
        filters: {},
        missingRequired: dedupedMissing,
        ambiguities: dedupedAmbiguities,
        suggestedTools: ['searchCustomer', 'lookupVehicleByRegoVin', 'checkDuplicateBooking'],
        responseMode: 'draft',
      },
      mode: 'draft',
      draft: {
        title: [mappedForm.year, mappedForm.brand, mappedForm.model].filter(Boolean).join(' ') || 'New booking draft',
        sourceText: prompt,
        summary: this.buildDraftSections(mappedForm),
        mappedForm,
        missingRequired: dedupedMissing,
        ambiguities: dedupedAmbiguities,
        duplicates,
        confidenceByField: {
          phoneNumber: mappedForm.phoneNumber ? 0.97 : 0.1,
          pickupAddress: mappedForm.pickupAddress ? 0.72 : 0.05,
        },
        leadReady: dedupedMissing.length === 0,
        bookedReady: !!(mappedForm.phoneNumber && mappedForm.pickupAddress && (mappedForm.registrationNumber || (mappedForm.brand && mappedForm.model)) && mappedForm.expectedDate),
      },
      ambiguities: duplicates,
      source: 'live',
    };
  }

  private async buildVehicleResult(prompt: string, departmentId?: number) {
    const rows = await this.findOrderCandidates(prompt, departmentId, 1);
    const row = rows[0];
    if (!row) {
      throw new CoolCommException('No matching vehicle was found');
    }

    return {
      interpret: {
        intent: 'vehicle_status_query',
        confidence: 0.94,
        entities: this.extractAnchors(prompt),
        filters: {},
        missingRequired: [],
        ambiguities: [],
        suggestedTools: ['findVehicleCandidates', 'getVehicle360'],
        responseMode: 'result',
      },
      mode: 'vehicle',
      vehicle: {
        carID: Number(row.carID),
        orderID: Number(row.orderID),
        stockNumber: row.quoteNumber,
        quoteNumber: row.quoteNumber,
        registrationNumber: row.registrationNumber,
        state: row.state,
        vinNumber: row.vinNumber,
        vehicleLabel: this.buildVehicleLabel(row),
        bookingStatus: this.bookingStatusLabel(Number(row.order_status), Number(row.job_status)),
        processingStage: cleanText(row.processingStage) || 'Booked',
        destination: cleanText(row.destination),
        customerName: [row.firstName, row.surname].filter(Boolean).join(' '),
        phoneNumber: row.phoneNumber,
        pickupAddress: row.pickupAddress,
        expectedDateLabel: row.expectedDate,
        latestComment: cleanText(row.commentText),
      },
      source: 'live',
    };
  }

  private async buildPartsResult(prompt: string, departmentId?: number) {
    const rows = await this.findOrderCandidates(prompt, departmentId, 1);
    const row = rows[0];
    if (!row) {
      throw new CoolCommException('No matching vehicle was found');
    }

    const summary = await this.buildPartsSummary(Number(row.carID));
    return {
      interpret: {
        intent: 'vehicle_parts_summary',
        confidence: 0.95,
        entities: this.extractAnchors(prompt),
        filters: {},
        missingRequired: [],
        ambiguities: [],
        suggestedTools: ['findVehicleCandidates', 'getPartsSummaryByCar'],
        responseMode: 'result',
      },
      mode: 'parts',
      parts: {
        carID: Number(row.carID),
        orderID: Number(row.orderID),
        registrationNumber: row.registrationNumber,
        stockNumber: row.quoteNumber,
        vehicleLabel: this.buildVehicleLabel(row),
        total: summary.total,
        inventory: summary.inventory,
        sold: summary.sold,
        closed: summary.closed,
        totalListedValue: summary.totalListedValue,
        totalSoldValue: summary.totalSoldValue,
      },
      source: 'live',
    };
  }

  async execute(prompt: string, departmentId?: number, entryPoint: 'search' | 'create' = 'search') {
    const intent = detectIntent(prompt, entryPoint);
    if (entryPoint === 'search' && intent === 'booking_create_draft') {
      return {
        interpret: {
          intent: 'unknown',
          confidence: 0.88,
          entities: {},
          filters: {},
          missingRequired: [],
          ambiguities: [],
          suggestedTools: [],
          responseMode: 'clarify',
        },
        mode: 'clarify',
        clarificationQuestion: 'This looks like a lead-creation request. Use Quick Create to generate a lead draft.',
        source: 'live',
      };
    }
    if (intent === 'operations_filter_query') {
      return this.buildOperationsResult(prompt, departmentId);
    }
    if (intent === 'vehicle_parts_summary') {
      return this.buildPartsResult(prompt, departmentId);
    }
    if (intent === 'vehicle_status_query') {
      return this.buildVehicleResult(prompt, departmentId);
    }
    return this.createDraftFromPrompt(prompt, departmentId);
  }

  async commitLead(draft, departmentId?: number) {
    if (!departmentId) {
      throw new CoolCommException('departmentId is required');
    }

    const mappedForm = draft?.mappedForm || {};
    const sourceText = cleanText(draft?.sourceText) || cleanText(mappedForm.commentText);
    const firstName = cleanText(mappedForm.firstName) || 'Unknown';
    const surname = cleanText(mappedForm.surname);
    const phoneNumber = cleanText(mappedForm.phoneNumber);
    const emailAddress = cleanText(mappedForm.emailAddress);

    let customer = null;
    if (phoneNumber) {
      customer = await this.customerProfileEntity.findOne({
        phoneNumber,
        departmentId,
        isDel: false,
      });
    }
    if (!customer && emailAddress) {
      customer = await this.customerProfileEntity.findOne({
        emailAddress,
        departmentId,
        isDel: false,
      });
    }

    if (!customer) {
      customer = await this.customerProfileEntity.save({
        firstName,
        surname,
        phoneNumber,
        emailAddress,
        address: cleanText(mappedForm.pickupAddress),
        customerAt: 'Private',
        departmentId,
        isDel: false,
      });
    }

    const registrationNumber = cleanText(mappedForm.registrationNumber).toUpperCase();
    const vinNumber = cleanText(mappedForm.vinNumber).toUpperCase();
    let car = null;
    if (vinNumber) {
      car = await this.carEntity.findOne({
        customerID: customer.id,
        vinNumber,
      });
    }
    if (!car && registrationNumber) {
      car = await this.carEntity.findOne({
        customerID: customer.id,
        registrationNumber,
      });
    }

    const carPayload = {
      customerID: customer.id,
      departmentId,
      name: [mappedForm.year, mappedForm.brand, mappedForm.model].filter(Boolean).join(' '),
      year: toNumber(mappedForm.year),
      brand: cleanText(mappedForm.brand),
      model: cleanText(mappedForm.model),
      colour: cleanText(mappedForm.colour),
      registrationNumber,
      state: cleanText(mappedForm.state).toUpperCase(),
      vinNumber,
      engine: cleanText(mappedForm.engine),
      series: cleanText(mappedForm.series),
      bodyStyle: cleanText(mappedForm.bodyStyle),
      engineCode: cleanText(mappedForm.engineCode),
      engineNumber: cleanText(mappedForm.engineNumber),
      transmission: cleanText(mappedForm.transmission),
      fuel: cleanText(mappedForm.fuel),
      power: cleanText(mappedForm.power),
      cylinders: toNumber(mappedForm.cylinders),
      carInfo: cleanText(mappedForm.carInfo),
    };

    if (car) {
      car = await this.carEntity.save({
        id: car.id,
        ...carPayload,
      });
    } else {
      car = await this.carEntity.save(carPayload);
    }

    const order = await this.orderService.add({
      customerID: customer.id,
      carID: car.id,
      departmentId,
      status: 0,
      pickupAddress: cleanText(mappedForm.pickupAddress),
      pickupAddressState: cleanText(mappedForm.pickupAddressState || mappedForm.state).toUpperCase(),
      pickupAddressLat: cleanText(mappedForm.pickupAddressLat),
      pickupAddressLng: cleanText(mappedForm.pickupAddressLng),
      quoteType: cleanText(mappedForm.quoteType) || 'Fixed',
      actualPaymentPrice: toNumber(mappedForm.actualPaymentPrice),
      payMethod: cleanText(mappedForm.payMethod),
      expectedDate: inferExpectedDate(mappedForm.expectedDate),
      commentText: cleanText(mappedForm.commentText) || sourceText,
      note: sourceText,
      source: 'ai',
      leadSource: 'AI',
      leadSourceDetail: 'Quick Create / Search',
      isDrivable: mappedForm.isDrivable === 0 ? 0 : 1,
      notDrivableReason: cleanText(mappedForm.notDrivableReason),
      gotVehicleComplete: mappedForm.gotVehicleComplete,
      gotAccidentDamage: mappedForm.gotAccidentDamage,
      gotFireFloodDamage: mappedForm.gotFireFloodDamage,
      gotMissingComponents: mappedForm.gotMissingComponents,
    });

    await this.orderActionEntity.save({
      timestamp: String(Date.now()),
      name: 'AI Quick Create',
      description: 'Created lead via AI command surface',
      authorID: this.ctx.admin?.userId || 0,
      orderID: order.id,
      type: 0,
    });

    return {
      id: order.id,
      quoteNumber: order.quoteNumber,
      customerID: customer.id,
      carID: car.id,
      status: order.status,
    };
  }
}
