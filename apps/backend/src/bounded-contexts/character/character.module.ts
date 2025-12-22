import { Module, forwardRef } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ItemDefinition, ItemDefinitionSchema } from "../item/infrastructure/persistence/mongo/schemas/ItemDefinition.js";
import { ItemDefinitionService } from "../item/domain/services/ItemDefinitionService.js";
import {
  CharacterController,
  CharacterInventoryController,
  CharacterInspirationController,
} from "./api/controllers/index.js";
import { Character, CharacterSchema } from "./infrastructure/persistence/mongo/schemas/CharacterDocument.js";
import { AptitudeModule } from "../spell/spell.module.js";
import { ClassDefinitionModule } from "../../domain/class-definition/class-definition.module.js";

// Clean Architecture imports
import { CharacterAppService } from "./application/services/CharacterAppService.js";
import { ICharacterRepository } from "./domain/repositories/ICharacterRepository.js";
import { MongoCharacterRepository } from "./infrastructure/persistence/mongo/repositories/MongoCharacterRepository.js";
import { CharacterDtoMapper } from "./api/dto/mappers/CharacterDtoMapper.js";

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
