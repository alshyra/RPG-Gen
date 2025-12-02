import {
  Prop, Schema,
} from '@nestjs/mongoose';
import type { InventoryItemMeta } from '../../domain/character/dto/InventoryItemMeta.js';

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
    required: false,
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
