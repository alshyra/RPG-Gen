import { Prop, Schema } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import { Race } from './Race.js';
import { CharacterClass } from './CharacterClass.js';
import { AbilityScores } from './AbilityScores.js';
import { Skill } from './Skill.js';
import { Item } from './Item.js';
import { Spell } from './Spell.js';

@Schema({ timestamps: true })
export class Character {
  @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: String })
  characterId: string;

  @Prop({ required: false, type: String })
  name: string;

  @Prop({ required: false, type: String })
  physicalDescription: string;

  @Prop({ type: Race, required: false })
  race: Race;

  @Prop({ type: AbilityScores, required: false })
  scores: AbilityScores;

  @Prop({ required: false, type: Number })
  hp: number;

  @Prop({ required: false, type: Number })
  hpMax: number;

  @Prop({ required: false, default: 0, type: Number })
  totalXp: number;

  @Prop({ type: [CharacterClass], required: false })
  classes: CharacterClass[];

  @Prop({ type: [Skill], required: false })
  skills: Skill[];

  @Prop({ required: true, type: String })
  world: string;

  @Prop({ type: String })
  portrait: string;

  @Prop({ required: false, type: String })
  gender: string;

  @Prop({ required: false, default: 2, type: Number })
  proficiency: number;

  @Prop({ required: false, default: 1, type: Number })
  inspirationPoints: number;

  @Prop({ default: false, type: Boolean })
  isDeceased: boolean;

  @Prop({ type: Date })
  diedAt: Date;

  @Prop({ type: String })
  deathLocation: string;

  @Prop({ required: true, default: 'draft', type: String })
  state: 'draft' | 'created';

  @Prop({ type: [Item], required: false, default: [] })
  inventory: Item[];

  @Prop({ type: [Spell], required: false, default: [] })
  spells: Spell[];
}
