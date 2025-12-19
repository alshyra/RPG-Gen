import { Module } from "@nestjs/common";
import { ProgressionController } from "../controllers/progression.controller.js";
import { ProgressionModule as ProgressionDomainModule } from "../domain/progression/progression.module.js";

@Module({
  imports: [ProgressionDomainModule],
  controllers: [ProgressionController],
})
export class ProgressionModule {}
