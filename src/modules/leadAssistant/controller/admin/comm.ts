import { Body, Controller, Inject, Post, Provide } from '@midwayjs/decorator';
import { BaseController } from '@cool-midway/core';
import { LeadAssistantCustomerResolveService } from '../../service/customerResolve';
import { LeadAssistantDuplicateCheckService } from '../../service/duplicateCheck';
import { LeadAssistantIntakeService } from '../../service/intake';
import { LeadAssistantCommitService } from '../../service/commit';
import { LeadAssistantSessionService } from '../../service/session';
import { LeadAssistantScheduleResolveService } from '../../service/scheduleResolve';
import { LeadAssistantVehicleResolveService } from '../../service/vehicleResolve';

@Provide()
@Controller('/admin/base/comm/lead-assistant')
export class LeadAssistantCommController extends BaseController {
  @Inject()
  leadAssistantSessionService: LeadAssistantSessionService;

  @Inject()
  leadAssistantIntakeService: LeadAssistantIntakeService;

  @Inject()
  leadAssistantCustomerResolveService: LeadAssistantCustomerResolveService;

  @Inject()
  leadAssistantDuplicateCheckService: LeadAssistantDuplicateCheckService;

  @Inject()
  leadAssistantScheduleResolveService: LeadAssistantScheduleResolveService;

  @Inject()
  leadAssistantVehicleResolveService: LeadAssistantVehicleResolveService;

  @Inject()
  leadAssistantCommitService: LeadAssistantCommitService;

  @Post('/session/start')
  async start(@Body('departmentId') departmentId: number) {
    const result = await this.leadAssistantSessionService.createSession(
      Number(departmentId)
    );
    return this.ok(result);
  }

  @Post('/session/info')
  async sessionInfo(
    @Body('id') id: string,
    @Body('departmentId') departmentId: number
  ) {
    const result = await this.leadAssistantSessionService.getSession(
      id,
      Number(departmentId)
    );
    return this.ok(result);
  }

  @Post('/session/intake')
  async intake(
    @Body('id') id: string,
    @Body('departmentId') departmentId: number,
    @Body('intakeText') intakeText: string
  ) {
    const result = await this.leadAssistantIntakeService.run(
      id,
      Number(departmentId),
      intakeText
    );
    return this.ok(result);
  }

  @Post('/session/check-duplicates')
  async checkDuplicates(
    @Body('id') id: string,
    @Body('departmentId') departmentId: number,
    @Body('draftLead') draftLead: Record<string, any>
  ) {
    const result = await this.leadAssistantDuplicateCheckService.checkDuplicates(
      id,
      Number(departmentId),
      draftLead || {}
    );
    return this.ok(result);
  }

  @Post('/session/resolve-customer')
  async resolveCustomer(
    @Body('id') id: string,
    @Body('departmentId') departmentId: number,
    @Body('draftCustomer') draftCustomer: Record<string, any>
  ) {
    const result =
      await this.leadAssistantCustomerResolveService.resolveCandidates(
        id,
        Number(departmentId),
        draftCustomer || {}
    );
    return this.ok(result);
  }

  @Post('/session/resolve-schedule')
  async resolveSchedule(
    @Body('id') id: string,
    @Body('departmentId') departmentId: number,
    @Body('draftSchedule') draftSchedule: Record<string, any>
  ) {
    const result = await this.leadAssistantScheduleResolveService.resolveSchedule(
      id,
      Number(departmentId),
      draftSchedule || {}
    );
    return this.ok(result);
  }

  @Post('/session/select-customer')
  async selectCustomer(
    @Body('id') id: string,
    @Body('departmentId') departmentId: number,
    @Body('selectedMode') selectedMode: string,
    @Body('selectedCustomerId') selectedCustomerId?: number,
    @Body('updateMode') updateMode?: string
  ) {
    const result =
      await this.leadAssistantCustomerResolveService.selectResolution(
        id,
        Number(departmentId),
        {
          selectedMode: selectedMode as any,
          selectedCustomerId,
          updateMode: updateMode as any,
        }
    );
    return this.ok(result);
  }

  @Post('/session/resolve-vehicle')
  async resolveVehicle(
    @Body('id') id: string,
    @Body('departmentId') departmentId: number,
    @Body('draftVehicle') draftVehicle: Record<string, any>
  ) {
    const result =
      await this.leadAssistantVehicleResolveService.resolveCandidates(
        id,
        Number(departmentId),
        draftVehicle || {}
      );
    return this.ok(result);
  }

  @Post('/session/select-vehicle')
  async selectVehicle(
    @Body('id') id: string,
    @Body('departmentId') departmentId: number,
    @Body('selectedSource') selectedSource: string,
    @Body('selectedVehicleId') selectedVehicleId?: number,
    @Body('selectedLookupPayload') selectedLookupPayload?: Record<string, any>
  ) {
    const result =
      await this.leadAssistantVehicleResolveService.selectResolution(
        id,
        Number(departmentId),
        {
          selectedSource: selectedSource as any,
          selectedVehicleId,
          selectedLookupPayload,
        }
      );
    return this.ok(result);
  }

  @Post('/session/commit-lead')
  async commitLead(
    @Body('id') id: string,
    @Body('departmentId') departmentId: number,
    @Body('continueAsNew') continueAsNew?: boolean
  ) {
    const result = await this.leadAssistantCommitService.commitLead(
      id,
      Number(departmentId),
      { continueAsNew: Boolean(continueAsNew) }
    );
    return this.ok(result);
  }
}
