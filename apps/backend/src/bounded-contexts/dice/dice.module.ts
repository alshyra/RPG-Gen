import { Module } from "@nestjs/common";
import { DiceController } from "./api/controllers/dice.controller.js";
import { DiceService } from "./domain/services/DiceService.js";

@Module({
  controllers: [DiceController],
  providers: [DiceService],
  exports: [DiceService],
})
export class DiceModule {}
