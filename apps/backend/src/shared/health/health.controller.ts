import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
  MemoryHealthIndicator,
} from "@nestjs/terminus";

/**
 * Health controller using NestJS Terminus for standardized health checks.
 * Exposes endpoints for Cloud Run probes and load balancer health checks.
 */
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  /**
   * Main health check endpoint for liveness/readiness probes.
   * Checks MongoDB connectivity and memory usage.
   */
  @Get("health")
  @HealthCheck()
  check() {
    return this.health.check([
      // MongoDB connection check
      () => this.mongoose.pingCheck("mongodb"),
      // Memory heap check - fails if using more than 400MB
      () => this.memory.checkHeap("memory_heap", 400 * 1024 * 1024),
    ]);
  }

  /**
   * Lightweight liveness probe - just confirms the process is running.
   * Used by Kubernetes/Cloud Run for quick liveness checks.
   */
  @Get("health/liveness")
  liveness() {
    return {
      status: "ok",
      pid: process.pid,
      uptime: process.uptime(),
    };
  }
}
