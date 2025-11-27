import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type { InventoryItemMeta } from '../character/dto/InventoryItemMeta.js';

@Schema({ timestamps: true })
export class ItemDefinition {
  @Prop({ required: true, unique: true })
  definitionId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: Object, default: {} })
  meta: InventoryItemMeta;

  @Prop({ default: true })
  isEditable: boolean;
}

export type ItemDefinitionDocument = ItemDefinition & Document;
export const ItemDefinitionSchema = SchemaFactory.createForClass(ItemDefinition);
