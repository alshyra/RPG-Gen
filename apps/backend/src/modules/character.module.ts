import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ItemDefinition, ItemDefinitionSchema } from "../infra/mongo/item/ItemDefinition.js";
import { ItemDefinitionService } from "../domain/item-definition/item-definition.service.js";
import {
  CharacterController,
  CharacterInventoryController,
  CharacterInspirationController,
} from "../controllers/characters/index.js";
import { Character, CharacterSchema } from "../infra/mongo/index.js";
import { AptitudeModule } from "../domain/aptitude/aptitude.module.js";
import { ClassDefinitionModule } from "../domain/class-definition/class-definition.module.js";

// Clean Architecture imports
import { CharacterAppService } from "../application/character/CharacterAppService.js";
import { ICharacterRepository } from "../domain/character/repositories/ICharacterRepository.js";
import { MongoCharacterRepository } from "../infra/persistence/mongo/repositories/MongoCharacterRepository.js";
import { CharacterDtoMapper } from "../api/character/dto/mappers/CharacterDtoMapper.js";

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
  providers: [
    ItemDefinitionService,
    // Clean Architecture providers
    CharacterAppService,
    CharacterDtoMapper,
    {
      provide: ICharacterRepository,
      useClass: MongoCharacterRepository,
    },
  ],
  exports: [
    ItemDefinitionService,
    // Clean Architecture exports
    CharacterAppService,
    CharacterDtoMapper,
    ICharacterRepository,
  ],
})
export class CharacterModule {}
