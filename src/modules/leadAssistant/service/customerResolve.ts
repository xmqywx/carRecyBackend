import { Inject, Provide } from '@midwayjs/decorator';
import { BaseService } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { CustomerProfileEntity } from '../../customer/entity/profile';
import { LeadAssistantSessionService } from './session';

function cleanText(value: unknown) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function uniqueById<T extends { id: number }>(items: T[]) {
  const map = new Map<number, T>();
  items.forEach(item => {
    if (!map.has(item.id)) map.set(item.id, item);
  });
  return Array.from(map.values());
}

@Provide()
export class LeadAssistantCustomerResolveService extends BaseService {
  @InjectEntityModel(CustomerProfileEntity)
  customerProfileEntity: Repository<CustomerProfileEntity>;

  @Inject()
  leadAssistantSessionService: LeadAssistantSessionService;

  private toCandidate(
    customer: CustomerProfileEntity,
    matchReason: string,
    score: number
  ) {
    return {
      id: customer.id,
      label: [customer.firstName, customer.surname].filter(Boolean).join(' '),
      firstName: customer.firstName,
      surname: customer.surname,
      phoneNumber: customer.phoneNumber,
      emailAddress: customer.emailAddress,
      address: customer.address,
      matchReason,
      score,
      recommendedAction: score >= 100 ? 'use-existing' : 'review',
    };
  }

  async resolveCandidates(
    sessionId: string,
    departmentId: number,
    draftCustomer: {
      fullName?: string;
      firstName?: string;
      surname?: string;
      phone?: string;
      email?: string;
    }
  ) {
    const phone = cleanText(draftCustomer.phone);
    const email = cleanText(draftCustomer.email);
    const fullName =
      cleanText(draftCustomer.fullName) ||
      [cleanText(draftCustomer.firstName), cleanText(draftCustomer.surname)]
        .filter(Boolean)
        .join(' ');

    const exactPhone = phone
      ? await this.customerProfileEntity.find({
          phoneNumber: phone,
          departmentId,
          isDel: false,
        } as any)
      : [];

    const exactEmail = email
      ? await this.customerProfileEntity.find({
          emailAddress: email,
          departmentId,
          isDel: false,
        } as any)
      : [];

    const fuzzyName = fullName
      ? await this.customerProfileEntity
          .createQueryBuilder('c')
          .where('c.departmentId = :departmentId', { departmentId })
          .andWhere('(c.firstName LIKE :kw OR c.surname LIKE :kw)', {
            kw: `%${fullName}%`,
          })
          .getMany()
      : [];

    const ranked = uniqueById([
      ...exactPhone.map(item => this.toCandidate(item, 'exact-phone', 120)),
      ...exactEmail.map(item => this.toCandidate(item, 'exact-email', 110)),
      ...fuzzyName.map(item => this.toCandidate(item, 'fuzzy-name', 70)),
    ]).sort((a, b) => b.score - a.score);

    const result = {
      candidates: ranked,
      recommendedMode: ranked[0]?.score >= 100 ? 'use-existing' : 'create-new',
    };

    return await this.leadAssistantSessionService.patchSession(sessionId, departmentId, {
      customerResolution: result,
      status: ranked.length ? 'drafted' : 'drafted',
    });
  }

  async selectResolution(
    sessionId: string,
    departmentId: number,
    payload: {
      selectedMode: 'use-existing' | 'create-new' | 'use-existing-update-missing' | 'use-existing-review';
      selectedCustomerId?: number;
      updateMode?: 'none' | 'missing-fields-only' | 'review-all-changes';
    }
  ) {
    const session = await this.leadAssistantSessionService.getSession(
      sessionId,
      departmentId
    );
    return await this.leadAssistantSessionService.patchSession(sessionId, departmentId, {
      customerResolution: {
        ...(session.customerResolution || {}),
        selectedMode: payload.selectedMode,
        selectedCustomerId: payload.selectedCustomerId || null,
        updateMode: payload.updateMode || 'none',
      },
      status: 'customer_resolved',
    });
  }
}
