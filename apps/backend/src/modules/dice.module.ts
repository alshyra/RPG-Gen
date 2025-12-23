import { Module } from "@nestjs/common";
import { DiceController } from "../bounded-contexts/dice/api/controllers/dice.controller.js";
import { DiceService } from "../bounded-contexts/dice/domain/services/DiceService.js";

@Module({
  controllers: [DiceController],
  providers: [DiceService],
  exports: [DiceService],
})
export class DiceModule {}
