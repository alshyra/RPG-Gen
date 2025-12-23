import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ArchetypesController } from "./api/controllers/archetypes.controller.js";
import { ArchetypeAppService } from "./application/services/ArchetypeAppService.js";
import { ArchetypeDocument, ArchetypeSchema } from "./infrastructure/persistence/mongo/schemas/ArchetypeDocument.js";
import { MongoArchetypeRepository } from "./infrastructure/persistence/mongo/repositories/MongoArchetypeRepository.js";
import { IArchetypeRepository } from "./domain/repositories/IArchetypeRepository.js";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ArchetypeDocument.name,
        schema: ArchetypeSchema,
      },
    ]),
  ],
  controllers: [ArchetypesController],
  providers: [
    {
      provide: IArchetypeRepository,
      useClass: MongoArchetypeRepository,
    },
    ArchetypeAppService,
  ],
  exports: [ArchetypeAppService, IArchetypeRepository],
})
export class ArchetypeModule {}
