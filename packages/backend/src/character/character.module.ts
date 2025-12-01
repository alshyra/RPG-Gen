import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemDefinitionController } from '../item-definition/item-definition.controller.js';
import { ItemDefinition, ItemDefinitionSchema } from '../item-definition/item-definition.schema.js';
import { ItemDefinitionService } from '../item-definition/item-definition.service.js';
import { CharacterController } from './character.controller.js';
import { CharacterService } from './character.service.js';
import { Character, CharacterSchema } from './schema/index.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Character.name, schema: CharacterSchema },
      { name: ItemDefinition.name, schema: ItemDefinitionSchema },
    ]),
  ],
  controllers: [
    CharacterController,
    ItemDefinitionController,
  ],
  providers: [
    CharacterService,
    ItemDefinitionService,
  ],
  exports: [
    CharacterService,
    ItemDefinitionService,
  ],
})
export class CharacterModule {}
