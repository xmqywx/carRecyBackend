import { Inject, Provide } from '@midwayjs/decorator';
import { BaseService, CoolCommException } from '@cool-midway/core';
import { InjectEntityModel } from '@midwayjs/orm';
import { Repository } from 'typeorm';
import { BaseSysUserEntity } from '../../base/entity/sys/user';
import { BaseSysRoleEntity } from '../../base/entity/sys/role';
import { BaseSysUserRoleEntity } from '../../base/entity/sys/user_role';
import { JobEntity } from '../../job/entity/info';
import { LeadAssistantSessionService } from './session';

// Thresholds per spec §11
const AVAILABLE_SLACK_MINUTES = 45;
const TIGHT_SLACK_MINUTES = 15;

export interface DriverCandidate {
  driverId: number;
  name: string;
  status: 'available' | 'tight' | 'conflict' | 'unassigned-eligible';
  conflictReason?: string;
  jobsToday: number;
  estimatedFit: number;
}

export interface DriverRecommendResponse {
  candidates: DriverCandidate[];
  scheduleAnchor: string;
}

function toMs(isoOrStr: string): number {
  return new Date(isoOrStr).getTime();
}

/**
 * Returns the minimum slack (in minutes) between the target window and
 * any existing job for a single driver. If there is an overlap, returns -1.
 */
export function computeSlack(
  targetStart: number,
  targetEnd: number,
  jobs: Array<{ schedulerStart: string; schedulerEnd: string }>,
): number {
  let minSlack = Infinity;

  for (const job of jobs) {
    const jStart = toMs(job.schedulerStart);
    const jEnd = toMs(job.schedulerEnd);

    // Overlap check: [jStart, jEnd) overlaps [targetStart, targetEnd)
    if (jStart < targetEnd && jEnd > targetStart) {
      return -1; // conflict
    }

    // Gap before target
    const gapBefore = (targetStart - jEnd) / 60_000;
    // Gap after target
    const gapAfter = (jStart - targetEnd) / 60_000;

    if (gapBefore > 0) minSlack = Math.min(minSlack, gapBefore);
    if (gapAfter > 0) minSlack = Math.min(minSlack, gapAfter);
  }

  return minSlack === Infinity ? Infinity : minSlack;
}

export function classifyDriver(
  targetStart: number,
  targetEnd: number,
  jobsToday: Array<{ schedulerStart: string; schedulerEnd: string }>,
): { status: DriverCandidate['status']; estimatedFit: number; conflictReason?: string } {
  if (jobsToday.length === 0) {
    return { status: 'unassigned-eligible', estimatedFit: 0.3 };
  }

  const slack = computeSlack(targetStart, targetEnd, jobsToday);

  if (slack < 0) {
    return {
      status: 'conflict',
      estimatedFit: 0.0,
      conflictReason: 'Overlapping job in schedule',
    };
  }

  if (slack < TIGHT_SLACK_MINUTES) {
    return { status: 'tight', estimatedFit: 0.6 };
  }

  if (slack < AVAILABLE_SLACK_MINUTES) {
    return { status: 'tight', estimatedFit: 0.6 };
  }

  return { status: 'available', estimatedFit: 1.0 };
}

@Provide()
export class DriverAvailabilityService extends BaseService {
  @InjectEntityModel(BaseSysUserEntity)
  baseSysUserEntity: Repository<BaseSysUserEntity>;

  @InjectEntityModel(BaseSysRoleEntity)
  baseSysRoleEntity: Repository<BaseSysRoleEntity>;

  @InjectEntityModel(BaseSysUserRoleEntity)
  baseSysUserRoleEntity: Repository<BaseSysUserRoleEntity>;

  @InjectEntityModel(JobEntity)
  jobEntity: Repository<JobEntity>;

  @Inject()
  leadAssistantSessionService: LeadAssistantSessionService;

  /**
   * Recommend drivers for the given session + department.
   *
   * Strategy:
   * 1. Look up the role with label='driver' in base_sys_role.
   * 2. Find all users in that role AND in the given department.
   * 3. For each driver, fetch jobs on the target day and classify.
   * 4. Return top-5 sorted by estimatedFit DESC.
   */
  async recommendDrivers(
    sessionId: string,
    departmentId: number,
  ): Promise<DriverRecommendResponse> {
    const session = await this.leadAssistantSessionService.getSession(
      sessionId,
      departmentId,
    );

    if (!session) {
      throw new CoolCommException('Session not found.');
    }

    // Determine schedule anchor from session
    const schedule = (session as any).scheduleResolution || {};
    const anchorRaw: string | undefined =
      schedule.expectedDate ||
      schedule.schedulerStart ||
      (session as any).extractedDraft?.schedule?.preferredTimeText;

    // Fall back to tomorrow noon if nothing in session
    const scheduleAnchor = anchorRaw
      ? new Date(anchorRaw).toISOString()
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + 1);
          d.setHours(12, 0, 0, 0);
          return d.toISOString();
        })();

    // Target window: anchor ± 2h (default if no explicit end time)
    const anchorMs = new Date(scheduleAnchor).getTime();
    const targetStart = anchorMs;
    const targetEnd = anchorMs + 2 * 60 * 60_000;

    // Day boundary for fetching jobs (same calendar day as anchor)
    const dayStart = new Date(scheduleAnchor);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(scheduleAnchor);
    dayEnd.setHours(23, 59, 59, 999);
    const dayStartStr = dayStart.toISOString();
    const dayEndStr = dayEnd.toISOString();

    // Find driver role (label='driver')
    const driverRole = await this.baseSysRoleEntity.findOne({ label: 'driver' } as any);
    if (!driverRole) {
      // No driver role configured — return empty list gracefully
      return { candidates: [], scheduleAnchor };
    }

    // Find users with the driver role
    const userRoleRows = await this.baseSysUserRoleEntity.find({
      roleId: driverRole.id,
    } as any);

    if (!userRoleRows.length) {
      return { candidates: [], scheduleAnchor };
    }

    const driverIds = userRoleRows.map(r => r.userId);

    // Filter by departmentId and active status
    const drivers = await this.baseSysUserEntity
      .createQueryBuilder('u')
      .where('u.id IN (:...ids)', { ids: driverIds })
      .andWhere('u.departmentId = :departmentId', { departmentId })
      .andWhere('u.status = 1')
      .getMany();

    if (!drivers.length) {
      return { candidates: [], scheduleAnchor };
    }

    // Classify each driver
    const candidates: DriverCandidate[] = await Promise.all(
      drivers.map(async driver => {
        // Fetch jobs for this driver on the target day that have schedulerStart set
        const jobsToday = await this.jobEntity
          .createQueryBuilder('j')
          .where('j.driverID = :driverId', { driverId: driver.id })
          .andWhere('j.schedulerStart >= :dayStart', { dayStart: dayStartStr })
          .andWhere('j.schedulerStart <= :dayEnd', { dayEnd: dayEndStr })
          .getMany();

        const classification = classifyDriver(targetStart, targetEnd, jobsToday);

        return {
          driverId: driver.id,
          name: driver.name || driver.nickName || driver.username,
          status: classification.status,
          conflictReason: classification.conflictReason,
          jobsToday: jobsToday.length,
          estimatedFit: classification.estimatedFit,
        };
      }),
    );

    // Sort by estimatedFit DESC, take top 5
    const sorted = candidates
      .sort((a, b) => b.estimatedFit - a.estimatedFit)
      .slice(0, 5);

    return { candidates: sorted, scheduleAnchor };
  }
}
