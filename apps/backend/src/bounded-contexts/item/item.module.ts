import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ItemDefinition, ItemDefinitionSchema } from "./infrastructure/persistence/mongo/schemas/ItemDefinition.js";
import { ItemDefinitionService } from "./domain/services/ItemDefinitionService.js";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ItemDefinition.name, schema: ItemDefinitionSchema }]),
  ],
  providers: [ItemDefinitionService],
  exports: [ItemDefinitionService],
})
export class ItemDefinitionModule {}
