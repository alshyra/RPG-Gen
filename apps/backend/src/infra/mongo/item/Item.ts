import { Prop, Schema } from "@nestjs/mongoose";
import type { InventoryItemMeta } from "../../../bounded-contexts/character/api/dto/response/InventoryItemMeta.js";
import { Document } from "mongoose";

@Schema({ _id: false })
export class Item {
  @Prop({
    required: false,
    type: String,
  })
  _id: string;

  @Prop({
    required: true,
    type: String,
  })
  name: string;

  @Prop({
    required: true,
    default: 1,
    type: Number,
  })
  qty: number;

  @Prop({
    required: false,
    type: String,
  })
  description: string;

  @Prop({
    required: true,
    type: String,
  })
  definitionId: string;

  @Prop({
    required: false,
    default: false,
    type: Boolean,
  })
  equipped: boolean;

  @Prop({ type: Object })
  meta: InventoryItemMeta;
}

export type ItemDocument = Item & Document;
