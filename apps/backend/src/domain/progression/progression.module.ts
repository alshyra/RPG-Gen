import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Character, CharacterSchema } from "../../infra/mongo/index.js";
import { ItemDefinitionModule } from "../item-definition/item-definition.module.js";
import { ClassDefinitionModule } from "../class-definition/class-definition.module.js";
import { RaceModule } from "../race/race.module.js";
import { AptitudeModule } from "../aptitude/aptitude.module.js";
import { ProgressionService } from "./progression.service.js";
import { CharacterResponseMapper } from "../character/character-response.mapper.js";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Character.name, schema: CharacterSchema }]),
    ItemDefinitionModule,
    ClassDefinitionModule,
    RaceModule,
    forwardRef(() => AptitudeModule),
  ],
  providers: [ProgressionService, CharacterResponseMapper],
  exports: [ProgressionService, CharacterResponseMapper],
})
export class ProgressionModule {}
