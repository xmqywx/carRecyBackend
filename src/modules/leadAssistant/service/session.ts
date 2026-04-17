import { Inject, Provide } from '@midwayjs/decorator';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { CacheManager } from '@midwayjs/cache';
import { randomUUID } from 'crypto';
import { LeadAssistantSession } from '../types';

const SESSION_TTL_SECONDS = 60 * 60 * 4;

@Provide()
export class LeadAssistantSessionService extends BaseService {
  @Inject()
  cacheManager: CacheManager;

  private sessionKey(id: string) {
    return `lead-assistant:${id}`;
  }

  private deserialize(raw: unknown): LeadAssistantSession | null {
    if (!raw) return null;
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return raw as LeadAssistantSession;
  }

  async createSession(departmentId: number) {
    const session: LeadAssistantSession = {
      id: randomUUID(),
      departmentId,
      status: 'drafted',
      expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
    };
    await this.cacheManager.set(
      this.sessionKey(session.id),
      JSON.stringify(session),
      { ttl: SESSION_TTL_SECONDS }
    );
    return session;
  }

  async getSession(id: string, departmentId: number) {
    const session = this.deserialize(
      await this.cacheManager.get(this.sessionKey(id))
    );

    if (!session || session.departmentId !== departmentId) {
      throw new CoolCommException('Lead assistant session not found');
    }
    return session;
  }

  async patchSession(
    id: string,
    departmentId: number,
    patch: Partial<LeadAssistantSession>
  ) {
    const session = await this.getSession(id, departmentId);
    const nextSession: LeadAssistantSession = {
      ...session,
      ...patch,
      id: session.id,
      departmentId: session.departmentId,
      expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
    };
    await this.cacheManager.set(
      this.sessionKey(id),
      JSON.stringify(nextSession),
      { ttl: SESSION_TTL_SECONDS }
    );
    return nextSession;
  }
}
