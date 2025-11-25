import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CharacterController } from './character.controller.js';
import { CharacterService } from './character.service.js';
import { ItemDefinitionController } from './item-definition.controller.js';
import { ItemDefinitionService } from './item-definition.service.js';
import { ItemDefinition, ItemDefinitionSchema } from './item-definition.schema.js';
import { Character, CharacterSchema } from '../schemas/character.schema.js';

@Module({
  imports: [MongooseModule.forFeature([
    { name: Character.name, schema: CharacterSchema },
    { name: ItemDefinition.name, schema: ItemDefinitionSchema },
  ])],
  controllers: [
    CharacterController, ItemDefinitionController,
  ],
  providers: [
    CharacterService, ItemDefinitionService,
  ],
  exports: [
    CharacterService, ItemDefinitionService,
  ],
})
export class CharacterModule {}
