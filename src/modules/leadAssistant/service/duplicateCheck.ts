import { Inject, Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { CarEntity } from '../../car/entity/base';
import { CustomerProfileEntity } from '../../customer/entity/profile';
import { OrderInfoEntity } from '../../order/entity/info';
import { LeadAssistantSessionService } from './session';

function cleanText(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function cleanPhone(value: unknown) {
  return cleanText(value).replace(/[^\d+]/g, '');
}

function cleanEmail(value: unknown) {
  return cleanText(value).toLowerCase();
}

function cleanUpper(value: unknown) {
  return cleanText(value).toUpperCase();
}

function uniqueByOrderId<T extends { orderID: number }>(items: T[]) {
  const map = new Map<number, T>();
  items.forEach(item => {
    if (!map.has(item.orderID)) map.set(item.orderID, item);
  });
  return Array.from(map.values());
}

@Provide()
export class LeadAssistantDuplicateCheckService extends BaseService {
  @InjectEntityModel(OrderInfoEntity)
  orderInfoEntity: Repository<OrderInfoEntity>;

  @InjectEntityModel(CustomerProfileEntity)
  customerProfileEntity: Repository<CustomerProfileEntity>;

  @InjectEntityModel(CarEntity)
  carEntity: Repository<CarEntity>;

  @Inject()
  leadAssistantSessionService: LeadAssistantSessionService;

  private normalizeCandidate(row: Record<string, any>, anchors: Record<string, string>) {
    const matchReasons = Array.isArray(row.matchReasons)
      ? row.matchReasons.filter(Boolean)
      : [];
    const score = Number(row.score) || 0;
    const customerName = [cleanText(row.firstName), cleanText(row.surname)]
      .filter(Boolean)
      .join(' ');
    const vehicleLabel = [cleanText(row.year), cleanText(row.brand), cleanText(row.model)]
      .filter(Boolean)
      .join(' ');

    return {
      orderID: Number(row.orderID),
      customerID: row.customerID ? Number(row.customerID) : null,
      carID: row.carID ? Number(row.carID) : null,
      title:
        cleanText(row.quoteNumber) ||
        `Order #${Number(row.orderID)}`,
      subtitle: [customerName || 'Unknown customer', vehicleLabel || 'Unknown vehicle']
        .filter(Boolean)
        .join(' · '),
      meta: [
        cleanText(row.statusLabel),
        cleanText(row.createTime),
      ]
        .filter(Boolean)
        .join(' · '),
      customerName,
      phoneNumber: cleanText(row.phoneNumber),
      emailAddress: cleanText(row.emailAddress),
      registrationNumber: cleanUpper(row.registrationNumber),
      vinNumber: cleanUpper(row.vinNumber),
      state: cleanUpper(row.state),
      brand: cleanText(row.brand),
      model: cleanText(row.model),
      year: row.year === null || row.year === undefined || row.year === '' ? null : Number(row.year),
      score,
      matchReasons,
      anchors,
    };
  }

  private buildMatchReasonSet(input: {
    phone?: string;
    email?: string;
    rego?: string;
    vin?: string;
  }, row: Record<string, any>) {
    const reasons: string[] = [];
    if (input.phone && cleanPhone(row.phoneNumber) === input.phone) {
      reasons.push('phone');
    }
    if (input.email && cleanEmail(row.emailAddress) === input.email) {
      reasons.push('email');
    }
    if (input.rego && cleanUpper(row.registrationNumber) === input.rego) {
      reasons.push('rego');
    }
    if (input.vin && cleanUpper(row.vinNumber) === input.vin) {
      reasons.push('vin');
    }
    return reasons;
  }

  private scoreMatch(reasons: string[]) {
    const weights: Record<string, number> = {
      phone: 120,
      email: 110,
      rego: 105,
      vin: 100,
    };
    return reasons.reduce((total, reason) => total + (weights[reason] || 0), 0);
  }

  async checkDuplicates(
    sessionId: string,
    departmentId: number,
    draftLead: {
      phone?: string;
      email?: string;
      rego?: string;
      vin?: string;
      fullName?: string;
      firstName?: string;
      surname?: string;
    }
  ) {
    const anchors = {
      phone: cleanPhone(draftLead.phone),
      email: cleanEmail(draftLead.email),
      rego: cleanUpper(draftLead.rego),
      vin: cleanUpper(draftLead.vin),
    };

    const conditions: string[] = [];
    const params: Record<string, string> = {};
    if (anchors.phone) {
      conditions.push('customer.phoneNumber = :phone');
      params.phone = anchors.phone;
    }
    if (anchors.email) {
      conditions.push('LOWER(customer.emailAddress) = :email');
      params.email = anchors.email;
    }
    if (anchors.rego) {
      conditions.push('UPPER(car.registrationNumber) = :rego');
      params.rego = anchors.rego;
    }
    if (anchors.vin) {
      conditions.push('UPPER(car.vinNumber) = :vin');
      params.vin = anchors.vin;
    }

    let candidates: any[] = [];
    if (conditions.length) {
      candidates = await this.orderInfoEntity
        .createQueryBuilder('o')
        .leftJoin(CustomerProfileEntity, 'customer', 'o.customerID = customer.id')
        .leftJoin(CarEntity, 'car', 'o.carID = car.id')
        .select([
          'o.id as orderID',
          'o.customerID as customerID',
          'o.carID as carID',
          'o.status as status',
          'o.createTime as createTime',
          'o.quoteNumber as quoteNumber',
          'customer.firstName as firstName',
          'customer.surname as surname',
          'customer.phoneNumber as phoneNumber',
          'customer.emailAddress as emailAddress',
          'car.registrationNumber as registrationNumber',
          'car.vinNumber as vinNumber',
          'car.state as state',
          'car.brand as brand',
          'car.model as model',
          'car.year as year',
        ])
        .where('o.departmentId = :departmentId', { departmentId })
        .andWhere(`(${conditions.join(' OR ')})`, params)
        .orderBy('o.createTime', 'DESC')
        .limit(10)
        .getRawMany();
    }

    const normalized = uniqueByOrderId(
      candidates.map(row => {
        const matchReasons = this.buildMatchReasonSet(anchors, row);
        return this.normalizeCandidate(
          {
            ...row,
            score: this.scoreMatch(matchReasons),
            matchReasons,
            statusLabel: row.status,
          },
          anchors
        );
      })
    ).sort((a, b) => b.score - a.score);

    const result = {
      anchors,
      candidates: normalized,
      recommendedAction: normalized.length ? 'review' : 'continue',
      hasDuplicates: normalized.length > 0,
    };

    await this.leadAssistantSessionService.patchSession(sessionId, departmentId, {
      duplicateCheck: result,
      status: 'duplicate_checked',
    });

    return result;
  }
}
