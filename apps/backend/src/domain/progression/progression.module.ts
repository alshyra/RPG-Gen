import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Character, CharacterSchema } from "../../infra/mongo/index.js";
import { ItemDefinitionModule } from "../../bounded-contexts/item/item.module.js";
import { ClassDefinitionModule } from "../class-definition/class-definition.module.js";
import { RaceModule } from "../race/race.module.js";
import { AptitudeModule } from "../../bounded-contexts/spell/spell.module.js";
import { CharacterModule } from "../../bounded-contexts/character/character.module.js";
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
