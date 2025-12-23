import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ClassesController } from "./api/controllers/classes.controller.js";
import { ArchetypeService } from "./application/archetype.service.js";
import { ArchetypeDocument, ArchetypeSchema } from "./infrastructure/persistence/mongo/schemas/ArchetypeDocument.js";
import { ArchetypeDefinitionService } from "./application/archetype-definition.service.js";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ArchetypeDocument.name,
        schema: ArchetypeSchema,
      },
    ]),
  ],
  controllers: [ClassesController],
  providers: [ArchetypeService, ArchetypeDefinitionService],
  exports: [ArchetypeService, ArchetypeDefinitionService],
})
export class ClassesModule {}
