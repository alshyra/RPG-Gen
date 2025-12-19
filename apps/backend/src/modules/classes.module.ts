import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ClassesController } from "../controllers/classes.controller.js";
import { ClassesService } from "../domain/classes/classes.service.js";
import { ClassDefinition, ClassDefinitionSchema } from "../infra/mongo/class/ClassDefinition.js";
import { ClassDefinitionService } from "../domain/class-definition/class-definition.service.js";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ClassDefinition.name,
        schema: ClassDefinitionSchema,
      },
    ]),
  ],
  controllers: [ClassesController],
  providers: [ClassesService, ClassDefinitionService],
  exports: [ClassesService, ClassDefinitionService],
})
export class ClassesModule {}
