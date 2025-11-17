import { Controller, Get } from '@nestjs/common';

/**
 * Health controller exposes a minimal public endpoint for healthchecks.
 * This endpoint purposefully does not use authentication so external services
 * (load balancers, Kubernetes probes, CI/CD) can check the app liveness.
 */
@Controller()
export class HealthController {
  @Get('health')
  getHealth() {
    const now = Date.now();
    return {
      status: 'ok',
      pid: process.pid,
      uptime: process.uptime(),
      timestamp: now,
    };
  }
}
