import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { InventoryItemMeta } from "../../../../api/dto/response/InventoryItemMeta.js";

/**
 * Embedded inventory item schema (not a separate collection)
 * Represents an item in a character's inventory.
 */
@Schema({ _id: false })
export class InventoryItemEmbed {
  @Prop({ required: true })
  definitionId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: 1 })
  qty: number;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: true, default: false })
  equipped: boolean;

  @Prop({ type: Object, required: false })
  meta?: InventoryItemMeta;
}

export const InventoryItemEmbedSchema = SchemaFactory.createForClass(InventoryItemEmbed);
