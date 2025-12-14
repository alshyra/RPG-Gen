import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ClassLevel, ClassLevelSchema } from './ClassLevel.js';

@Schema({ timestamps: true })
export class ClassDefinition {
  @Prop({
    required: true,
    unique: true,
  })
  name: string;

  @Prop({ required: true })
  hitDie: string; // e.g., '1d8', '1d12'

  @Prop({ default: '' })
  primarySpellAbility?: string; // e.g., 'Cha', 'Sag', or null for non-spellcasters

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true })
  schemaVersion: number;

  @Prop({
    type: [ClassLevelSchema],
    required: true,
  })
  levels: ClassLevel[];

  @Prop({
    type: Map,
    of: [Object],
    default: new Map(),
  })
  allowedSpellsByLevel?: Map<string, { name: string; definitionId: string }[]>;
}

export type ClassDefinitionDocument = ClassDefinition & Document;
export const ClassDefinitionSchema = SchemaFactory.createForClass(ClassDefinition);
