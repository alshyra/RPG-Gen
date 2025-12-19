import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ItemDefinition, ItemDefinitionSchema } from "../../infra/mongo/item/ItemDefinition.js";
import { ItemDefinitionService } from "./item-definition.service.js";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ItemDefinition.name, schema: ItemDefinitionSchema }]),
  ],
  providers: [ItemDefinitionService],
  exports: [ItemDefinitionService],
})
export class ItemDefinitionModule {}
