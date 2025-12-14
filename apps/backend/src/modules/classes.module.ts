import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassesController } from '../controllers/classes.controller.js';
import { ClassesService } from '../domain/classes/classes.service.js';
import { SpellDefinition, SpellDefinitionSchema } from '../infra/mongo/spell/SpellDefinition.js';
import { SpellDefinitionService } from '../domain/spell-definition/spell-definition.service.js';
import { ClassDefinition, ClassDefinitionSchema } from '../infra/mongo/class/ClassDefinition.js';
import { ClassDefinitionService } from '../domain/class-definition/class-definition.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SpellDefinition.name,
        schema: SpellDefinitionSchema,
      },
      {
        name: ClassDefinition.name,
        schema: ClassDefinitionSchema,
      },
    ]),
  ],
  controllers: [ClassesController],
  providers: [ClassesService, SpellDefinitionService, ClassDefinitionService],
  exports: [ClassesService, ClassDefinitionService],
})
export class ClassesModule {}
