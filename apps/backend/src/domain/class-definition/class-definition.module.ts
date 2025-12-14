import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassDefinition, ClassDefinitionSchema } from '../../infra/mongo/class/ClassDefinition.js';
import { ClassDefinitionService } from './class-definition.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ClassDefinition.name,
        schema: ClassDefinitionSchema,
      },
    ]),
  ],
  providers: [ClassDefinitionService],
  exports: [ClassDefinitionService],
})
export class ClassDefinitionModule {}
