import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SpellMeta, SpellMetaSchema } from './SpellMeta.js';

@Schema({ timestamps: true })
export class SpellDefinition {
  @Prop({
    required: true,
    unique: true,
  })
  definitionId: string;

  @Prop({
    required: true,
    unique: true,
  })
  name: string;

  @Prop({ required: true })
  level: number;

  @Prop({ required: true })
  school: string;

  @Prop({ required: true })
  castingTime: string;

  @Prop({ required: true })
  range: string;

  @Prop({ required: true })
  components: string;

  @Prop({ default: 'instantaneous' })
  duration: string;

  @Prop({ default: false })
  ritual: boolean;

  @Prop({ default: '' })
  description: string;

  @Prop({
    type: SpellMetaSchema,
    default: {},
  })
  meta: SpellMeta;
}

export type SpellDefinitionDocument = SpellDefinition & Document;
export const SpellDefinitionSchema = SchemaFactory.createForClass(SpellDefinition);
