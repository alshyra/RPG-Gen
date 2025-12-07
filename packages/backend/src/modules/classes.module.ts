import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassesController } from '../controllers/classes.controller.js';
import { ClassesService } from '../domain/classes/classes.service.js';
import { SpellDefinition, SpellDefinitionSchema } from '../infra/mongo/spell-definition.schema.js';
import { SpellDefinitionService } from '../domain/spell-definition/spell-definition.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SpellDefinition.name,
        schema: SpellDefinitionSchema,
      },
    ]),
  ],
  controllers: [ClassesController],
  providers: [ClassesService, SpellDefinitionService],
  exports: [ClassesService],
})
export class ClassesModule {}
