import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * MongoDB schema for ItemDefinition
 * 
 * @infrastructure game-data
 * Framework-specific (NestJS/Mongoose)
 */

interface ItemMetaData {
  type?: string;
  class?: string;
  cost?: string;
  damage?: string;
  armorClass?: number;
  weight?: string;
  properties?: string[];
  starter?: boolean;
}

@Schema({ collection: 'item_definitions', timestamps: true })
export class ItemDocument extends Document {
  @Prop({ required: true, unique: true })
  definitionId: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({
    type: String,
    enum: ['head', 'body', 'weapon', 'accessory', 'consumable'],
  })
  slot?: string;

  @Prop({ type: Object, default: {} })
  meta: ItemMetaData;
}

export const ItemSchema = SchemaFactory.createForClass(ItemDocument);
