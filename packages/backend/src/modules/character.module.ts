import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ItemDefinition, ItemDefinitionSchema,
} from '../infra/mongo/item/ItemDefinition.js';
import {
  SpellDefinition, SpellDefinitionSchema,
} from '../infra/mongo/spell/SpellDefinition.js';
import { ItemDefinitionService } from '../domain/item-definition/item-definition.service.js';
import { LevelUpService } from '../domain/character/levelup.service.js';
import { SpellDefinitionService } from '../domain/spell-definition/spell-definition.service.js';
import { CharacterController } from '../controllers/character.controller.js';
import { CharacterService } from '../domain/character/character.service.js';
import {
  Character, CharacterSchema,
} from '../infra/mongo/index.js';

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
      {
        name: SpellDefinition.name,
        schema: SpellDefinitionSchema,
      },
    ]),
  ],
  controllers: [CharacterController],
  providers: [
    CharacterService,
    ItemDefinitionService,
    LevelUpService,
    SpellDefinitionService,
  ],
  exports: [
    CharacterService,
    ItemDefinitionService,
    LevelUpService,
    SpellDefinitionService,
  ],
})
export class CharacterModule {}
