import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Combatant } from './combatant.schema.js';

export type CombatSessionDocument = CombatSession & Document;

@Schema({ timestamps: true })
export class CombatSession {
  @Prop({
    required: true,
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({
    required: true,
    type: String,
    unique: true,
  })
  characterId: string;

  @Prop({
    required: true,
    type: Boolean,
    default: true,
  })
  inCombat: boolean;

  @Prop({
    type: [Combatant],
    required: true,
    default: [],
  })
  enemies: Combatant[];

  @Prop({
    type: Combatant,
    required: true,
  })
  player: Combatant;

  @Prop({
    type: [Combatant],
    required: true,
    default: [],
  })
  turnOrder: Combatant[];

  @Prop({
    required: true,
    type: Number,
    default: 0,
  })
  currentTurnIndex: number;

  @Prop({
    required: true,
    type: Number,
    default: 1,
  })
  roundNumber: number;

  // D&D 5e Action Economy
  @Prop({
    required: false,
    type: Number,
    default: 1,
  })
  actionRemaining: number;

  @Prop({
    required: false,
    type: Number,
    default: 1,
  })
  actionMax: number;

  @Prop({
    required: false,
    type: Number,
    default: 1,
  })
  bonusActionRemaining: number;

  @Prop({
    required: false,
    type: Number,
    default: 1,
  })
  bonusActionMax: number;

  @Prop({
    required: false,
    type: String,
    enum: [
      'PLAYER_TURN',
      'AWAITING_DAMAGE_ROLL',
      'ENEMY_TURN',
      'COMBAT_ENDED',
    ],
    default: 'PLAYER_TURN',
  })
  phase: string;
}

export const CombatSessionSchema = SchemaFactory.createForClass(CombatSession);

// Index for efficient querying
CombatSessionSchema.index({
  userId: 1,
  characterId: 1,
});
CombatSessionSchema.index({ characterId: 1 }, { unique: true });
