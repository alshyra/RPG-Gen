import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ItemDefinition, ItemDefinitionSchema } from "../infra/mongo/item/ItemDefinition.js";
import { ItemDefinitionService } from "../domain/item-definition/item-definition.service.js";
import {
  CharacterController,
  CharacterInventoryController,
  CharacterInspirationController,
} from "../controllers/characters/index.js";
import { CharacterService } from "../domain/character/character.service.js";
import { Character, CharacterSchema } from "../infra/mongo/index.js";

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
  ],
  controllers: [
    CharacterController,
    CharacterInventoryController,
    CharacterInspirationController,
  ],
  providers: [CharacterService, ItemDefinitionService ],
  exports: [CharacterService, ItemDefinitionService],
})
export class CharacterModule {}
