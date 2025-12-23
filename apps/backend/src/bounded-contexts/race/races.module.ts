import { Module } from "@nestjs/common";
import { RaceModule } from "./race.module.js";
import { RacesController } from "./races.controller.js";

@Module({
  imports: [RaceModule],
  controllers: [RacesController],
})
export class RacesModule {}
