import { Body, Controller, Inject, Post, Provide } from '@midwayjs/decorator';
import { BaseController } from '@cool-midway/core';
import { AiGatewayService } from '../../service/gateway';

@Provide()
@Controller('/admin/ai/gateway')
export class AiGatewayController extends BaseController {
  @Inject()
  aiGatewayService: AiGatewayService;

  @Post('/execute')
  async execute(
    @Body('prompt') prompt: string,
    @Body('departmentId') departmentId?: number,
    @Body('entryPoint') entryPoint?: 'search' | 'create'
  ) {
    const result = await this.aiGatewayService.execute(prompt, departmentId, entryPoint);
    return this.ok(result);
  }

  @Post('/commitLead')
  async commitLead(
    @Body('draft') draft: Record<string, any>,
    @Body('departmentId') departmentId?: number
  ) {
    const result = await this.aiGatewayService.commitLead(draft, departmentId);
    return this.ok(result);
  }
}
