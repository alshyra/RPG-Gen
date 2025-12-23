import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Race, RaceSchema } from "./mongo/race/index.js";
import { RaceService } from "./race.service.js";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Race.name, schema: RaceSchema }]),
  ],
  providers: [RaceService],
  exports: [RaceService],
})
export class RaceModule {}
