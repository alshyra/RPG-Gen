import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * MongoDB schema for Race
 * 
 * @infrastructure game-data
 * Framework-specific (NestJS/Mongoose)
 */

interface RacialBonusesData {
  vigor?: number;
  finesse?: number;
  mind?: number;
  survival?: number;
}

interface TraitEffectData {
  type: string;
  value: number;
  subType?: string;
  condition?: string;
}

@Schema({ collection: 'race_definitions', timestamps: true })
export class RaceDocument extends Document {
  @Prop({ required: true, unique: true })
  raceId: string; // 'humain', 'elfe', 'nain'

  @Prop({ required: true })
  name: string;

  @Prop({ type: Object, default: {} })
  bonuses: RacialBonusesData;

  @Prop({ required: true })
  trait: string;

  @Prop({ type: Object, required: true })
  traitEffect: TraitEffectData;

  @Prop()
  descriptionForAi?: string;

  @Prop()
  icon?: string;

  @Prop()
  color?: string;
}

export const RaceSchema = SchemaFactory.createForClass(RaceDocument);
