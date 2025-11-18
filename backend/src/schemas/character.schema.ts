import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CharacterDocument = Character & Document;

@Schema({ _id: false })
class Race {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Object })
  mods: Record<string, number>;
}

@Schema({ _id: false })
class CharacterClass {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  level: number;
}

@Schema({ _id: false })
class Skill {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  proficient: boolean;

  @Prop({ required: true })
  modifier: number;
}

@Schema({ _id: false })
class AbilityScores {
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

  @Prop({ type: [CharacterClass], required: true })
  classes: CharacterClass[];

  @Prop({ type: [Skill], required: true })
  skills: Skill[];

  @Prop({ required: true })
  world: string;

  @Prop()
  portrait: string;

  @Prop({ required: true })
  gender: string;

  @Prop({ required: true, default: 2 })
  proficiency: number;

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
