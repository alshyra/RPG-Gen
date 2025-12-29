import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { HealthController } from "./health.controller.js";

/**
 * Health module provides health check endpoints using NestJS Terminus.
 * Includes MongoDB and memory health indicators.
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
