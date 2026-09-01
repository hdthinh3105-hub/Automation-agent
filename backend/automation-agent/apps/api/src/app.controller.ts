import { Controller, Get } from '@nestjs/common';
import { Public } from '@app/shared/decorators/public.decorator';

/**
 * Minimal placeholder. Full `/health`, `/health/ready`, `/metrics` will
 * be implemented by the Monitoring Module in Phase 9 (TDD Mục 5.13) —
 * this just gives us something to hit while verifying Phase 1 setup.
 */
@Controller()
export class AppController {
  @Public()
  @Get()
  getRoot(): { name: string; status: string } {
    return { name: 'ai-customer-support-api', status: 'ok' };
  }

  @Public()
  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
