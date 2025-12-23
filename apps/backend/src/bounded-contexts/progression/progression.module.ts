import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Character, CharacterSchema } from "../../infra/mongo/index.js";
import { ItemDefinitionModule } from "../item/item.module.js";
import { ClassDefinitionModule } from "../../bounded-contexts/classes/class-definition.module.js";
import { RaceModule } from "../race/race.module.js";
import { AptitudeModule } from "../aptitude/aptitude.module.js";
import { CharacterModule } from "../character/character.module.js";
import { ProgressionService } from "./progression.service.js";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Character.name, schema: CharacterSchema }]),
    ItemDefinitionModule,
    ClassDefinitionModule,
    RaceModule,
    forwardRef(() => AptitudeModule),
    forwardRef(() => CharacterModule),
  ],
  providers: [ProgressionService],
  exports: [ProgressionService],
})
export class ProgressionModule {}
