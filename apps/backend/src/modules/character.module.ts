import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ItemDefinition, ItemDefinitionSchema } from "../infra/mongo/item/ItemDefinition.js";
import { ItemDefinitionService } from "../domain/item-definition/item-definition.service.js";
import {
  CharacterController,
  CharacterInventoryController,
  CharacterInspirationController,
} from "../controllers/characters/index.js";
import { CharacterService } from "../domain/character/character.service.js";
import { CharacterResponseMapper } from "../domain/character/character-response.mapper.js";
import { Character, CharacterSchema } from "../infra/mongo/index.js";
import { AptitudeModule } from "../domain/aptitude/aptitude.module.js";
import { ClassDefinitionModule } from "../domain/class-definition/class-definition.module.js";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Character.name,
        schema: CharacterSchema,
      },
      {
        name: ItemDefinition.name,
        schema: ItemDefinitionSchema,
      },
    ]),
    forwardRef(() => AptitudeModule),
    forwardRef(() => ClassDefinitionModule),
  ],
  controllers: [
    CharacterController,
    CharacterInventoryController,
    CharacterInspirationController,
  ],
  providers: [CharacterService, ItemDefinitionService, CharacterResponseMapper],
  exports: [CharacterService, ItemDefinitionService, CharacterResponseMapper],
})
export class CharacterModule {}
