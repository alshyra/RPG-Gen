import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * MongoDB schema for Aptitude
 * 
 * @infrastructure game-data
 * Framework-specific (NestJS/Mongoose)
 */

@Schema({ collection: 'aptitude_definitions', timestamps: true })
export class AptitudeDocument extends Document {
  @Prop({ required: true, unique: true })
  aptitudeId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: 1 })
  paCost: number;

  @Prop({ default: 0 })
  cooldown: number;

  @Prop({
    type: String,
    enum: ['self', 'ally', 'enemy', 'area', 'all_enemies', 'all_allies'],
    default: 'enemy',
  })
  targetType: string;

  @Prop({ default: 1 })
  range: number;

  @Prop({ default: 0 })
  basePower: number;

  @Prop({
    type: String,
    enum: ['vigor', 'finesse', 'mind', 'survival', 'none'],
    default: 'none',
  })
  scaling: string;

  @Prop({
    type: String,
    enum: ['damage', 'heal', 'buff', 'debuff', 'utility', 'summon'],
    default: 'damage',
  })
  effectType: string;

  @Prop({
    type: String,
    enum: ['dash', 'jump', 'teleport', 'push', 'pull'],
  })
  moveType?: string;

  @Prop({
    type: String,
    enum: ['circle_1', 'circle_2', 'circle_3', 'line_3', 'line_5', 'cone_3'],
  })
  area?: string;

  @Prop({
    type: String,
    enum: ['bleed', 'poison', 'stun', 'slow', 'burn', 'freeze', 'silence'],
  })
  status?: string;

  @Prop()
  descriptionForAi?: string;
}

export const AptitudeSchema = SchemaFactory.createForClass(AptitudeDocument);
