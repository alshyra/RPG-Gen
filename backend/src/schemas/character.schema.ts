import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CharacterDocument = Character & Document;

@Schema({ _id: false })
export class Race {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Object })
  mods: Record<string, number>;
}

@Schema({ _id: false })
export class InventoryItem {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  quantity: number;

  @Prop()
  description?: string;

  @Prop()
  weight?: number;

  @Prop()
  value?: number; // In gold pieces

  @Prop()
  equipped?: boolean;
}

@Schema({ _id: false })
export class CharacterClass {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  level: number;
}

@Schema({ _id: false })
export class Skill {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  proficient: boolean;

  @Prop({ required: true })
  modifier: number;
}

@Schema({ _id: false })
export class AbilityScores {
  @Prop({ required: true })
  Str: number;

  @Prop({ required: true })
  Dex: number;

  @Prop({ required: true })
  Con: number;

  @Prop({ required: true })
  Int: number;

  @Prop({ required: true })
  Wis: number;

  @Prop({ required: true })
  Cha: number;
}

@Schema({ _id: false })
export class Spell {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  level: number; // 0 for cantrips, 1-9 for spell levels

  @Prop({ required: true })
  school: string; // Evocation, Abjuration, etc.

  @Prop()
  castingTime?: string;

  @Prop()
  range?: string;

  @Prop()
  components?: string;

  @Prop()
  duration?: string;

  @Prop()
  description?: string;

  @Prop()
  prepared?: boolean;
}

export type Gender = 'male' | 'female';
@Schema({ timestamps: true })
export class Character {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  characterId: string; // UUID for client-side compatibility

  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  physicalDescription: string;

  @Prop({ type: Race, required: true })
  race: Race;

  @Prop({ type: AbilityScores, required: true })
  scores: AbilityScores;

  @Prop({ required: true })
  hp: number;

  @Prop({ required: true })
  hpMax: number;

  @Prop({ required: true, default: 0 })
  totalXp: number;

  // Allow partial characters (drafts) to be saved by making these optional
  @Prop({ type: [CharacterClass], default: [] })
  classes: CharacterClass[];

  @Prop({ type: [Skill], default: [] })
  skills: Skill[];

  @Prop({ required: false })
  world?: string;

  @Prop()
  portrait: string;

  @Prop({ required: false })
  gender?: Gender;

  @Prop({ required: true, default: 2 })
  proficiency: number;

  @Prop({ required: true, default: 'draft' })
  state: 'draft' | 'created';

  @Prop({ required: false })
  spells: Spell[];

  @Prop({ type: [InventoryItem], default: [] })
  inventory?: InventoryItem[];

  @Prop({ default: false })
  isDeceased: boolean;

  @Prop()
  diedAt: Date;

  @Prop()
  deathLocation: string;
}

export const CharacterSchema = SchemaFactory.createForClass(Character);

// Index for efficient querying
CharacterSchema.index({ userId: 1, characterId: 1 });
CharacterSchema.index({ userId: 1, isDeceased: 1 });
