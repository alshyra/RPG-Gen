import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ClassDefinition, ClassDefinitionSchema } from "../../bounded-contexts/classes/infrastructure/persistence/mongo/schemas/index.js";
import { TalentTreeService } from "./talent-tree.service.js";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: ClassDefinition.name,
        schema: ClassDefinitionSchema,
      },
    ]),
  ],
  providers: [TalentTreeService],
  exports: [TalentTreeService],
})
export class TalentTreeModule {}
