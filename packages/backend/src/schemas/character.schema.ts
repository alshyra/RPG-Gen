import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CharacterDocument = Character & Document;

@Schema({ _id: false })
class Race {
  @Prop({ required: true, type: String })
  id: string;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ type: Object })
  mods: Record<string, number>;
}

@Schema({ _id: false })
class CharacterClass {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: Number })
  level: number;
}

@Schema({ _id: false })
class Skill {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: Boolean })
  proficient: boolean;

  @Prop({ required: true, type: Number })
  modifier: number;
}

@Schema({ _id: false })
class AbilityScores {
  @Prop({ required: true, type: Number })
  Str: number;

  @Prop({ required: true, type: Number })
  Dex: number;

  @Prop({ required: true, type: Number })
  Con: number;

  @Prop({ required: true, type: Number })
  Int: number;

  @Prop({ required: true, type: Number })
  Wis: number;

  @Prop({ required: true, type: Number })
  Cha: number;
}

@Schema({ timestamps: true })
export class Character {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: String })
  characterId: string; // UUID for client-side compatibility

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: false, type: String })
  physicalDescription: string;

  @Prop({ type: Race, required: true })
  race: Race;

  @Prop({ type: AbilityScores, required: true })
  scores: AbilityScores;

  @Prop({ required: true, type: Number })
  hp: number;

  @Prop({ required: true, type: Number })
  hpMax: number;

  @Prop({ required: true, default: 0, type: Number })
  totalXp: number;

  @Prop({ type: [CharacterClass], required: true })
  classes: CharacterClass[];

  @Prop({ type: [Skill], required: true })
  skills: Skill[];

  @Prop({ required: true, type: String })
  world: string;

  @Prop({ type: String })
  portrait: string;

  @Prop({ required: true, type: String })
  gender: string;

  @Prop({ required: true, default: 2, type: Number })
  proficiency: number;

  @Prop({ default: false, type: Boolean })
  isDeceased: boolean;

  @Prop({ type: Date })
  diedAt: Date;

  @Prop({ type: String })
  deathLocation: string;

  @Prop({ required: true, default: 'draft', type: String })
  state: 'draft' | 'created';
}

export const CharacterSchema = SchemaFactory.createForClass(Character);

// Index for efficient querying
CharacterSchema.index({ userId: 1, characterId: 1 });
CharacterSchema.index({ userId: 1, isDeceased: 1 });
