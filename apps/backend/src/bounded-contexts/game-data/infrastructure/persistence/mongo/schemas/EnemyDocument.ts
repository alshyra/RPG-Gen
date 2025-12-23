import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * MongoDB schema for EnemyDefinition
 * 
 * @infrastructure game-data
 * Framework-specific (NestJS/Mongoose)
 */

@Schema({ collection: 'enemy_definitions', timestamps: true })
export class EnemyDocument extends Document {
  @Prop({ required: true, unique: true })
  enemyId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  hp: number;

  @Prop({ default: 0 })
  attackBonus: number;

  @Prop({ default: '1d6' })
  damageDice: string;

  @Prop({ default: 0 })
  damageBonus: number;

  @Prop({ type: [String], default: [] })
  aptitudes: string[];

  @Prop({ default: 1 })
  level: number;
}

export const EnemySchema = SchemaFactory.createForClass(EnemyDocument);
