import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CombatSessionDocument = CombatSession & Document;

@Schema({ _id: false })
class CombatEnemy {
  @Prop({ required: true, type: String })
  id: string;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: Number })
  hp: number;

  @Prop({ required: true, type: Number })
  hpMax: number;

  @Prop({ required: true, type: Number })
  ac: number;

  @Prop({ required: true, type: Number })
  initiative: number;

  @Prop({ required: true, type: Number })
  attackBonus: number;

  @Prop({ required: true, type: String })
  damageDice: string;

  @Prop({ required: true, type: Number })
  damageBonus: number;
}

@Schema({ _id: false })
class CombatPlayer {
  @Prop({ required: true, type: String })
  characterId: string;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: Number })
  hp: number;

  @Prop({ required: true, type: Number })
  hpMax: number;

  @Prop({ required: true, type: Number })
  ac: number;

  @Prop({ required: true, type: Number })
  initiative: number;

  @Prop({ required: true, type: Number })
  attackBonus: number;

  @Prop({ required: true, type: String })
  damageDice: string;

  @Prop({ required: true, type: Number })
  damageBonus: number;
}

@Schema({ _id: false })
class Combatant {
  @Prop({ required: true, type: String })
  id: string;

  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: Number })
  initiative: number;

  @Prop({ required: true, type: Boolean })
  isPlayer: boolean;
}

@Schema({ timestamps: true })
export class CombatSession {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: String, unique: true })
  characterId: string;

  @Prop({ required: true, type: Boolean, default: true })
  inCombat: boolean;

  @Prop({ type: [CombatEnemy], required: true, default: [] })
  enemies: CombatEnemy[];

  @Prop({ type: CombatPlayer, required: true })
  player: CombatPlayer;

  @Prop({ type: [Combatant], required: true, default: [] })
  turnOrder: Combatant[];

  @Prop({ required: true, type: Number, default: 0 })
  currentTurnIndex: number;

  @Prop({ required: true, type: Number, default: 1 })
  roundNumber: number;
}

export const CombatSessionSchema = SchemaFactory.createForClass(CombatSession);

// Index for efficient querying
CombatSessionSchema.index({ userId: 1, characterId: 1 });
CombatSessionSchema.index({ characterId: 1 }, { unique: true });
