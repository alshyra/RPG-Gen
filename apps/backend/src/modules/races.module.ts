import { Module } from "@nestjs/common";
import { RaceModule } from "../bounded-contexts/race/race.module.js";
import { RacesController } from "../controllers/races.controller.js";

@Module({
  imports: [RaceModule],
  controllers: [RacesController],
})
export class RacesModule {}
