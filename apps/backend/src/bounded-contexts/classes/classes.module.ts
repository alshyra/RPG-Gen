import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ClassesController } from "./api/controllers/classes.controller.js";
import { ClassesService } from "./application/classes.service.js";
import { ClassDefinitionDocument, ClassDefinitionSchema } from "./infrastructure/persistence/mongo/schemas/ClassDefinitionDocument.js";
import { ClassDefinitionService } from "./application/class-definition.service.js";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ClassDefinitionDocument.name,
        schema: ClassDefinitionSchema,
      },
    ]),
  ],
  controllers: [ClassesController],
  providers: [ClassesService, ClassDefinitionService],
  exports: [ClassesService, ClassDefinitionService],
})
export class ClassesModule {}
