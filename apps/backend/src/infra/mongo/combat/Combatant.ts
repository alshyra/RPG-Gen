import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type CombatantDocument = Combatant & Document;

@Schema({ _id: false })
export class Combatant {
  @Prop({
    required: true,
    type: String,
  })
  id: string;

  @Prop({
    required: true,
    type: String,
  })
  name: string;

  @Prop({
    required: true,
    type: Number,
  })
  initiative: number;

  @Prop({
    required: true,
    type: Boolean,
  })
  isPlayer: boolean;

  @Prop({
    required: false,
    type: Number,
  })
  hp?: number;

  @Prop({
    required: false,
    type: Number,
  })
  hpMax?: number;

  @Prop({
    required: false,
    type: Number,
  })
  attackBonus?: number;

  @Prop({
    required: false,
    type: String,
  })
  damageDice?: string;

  @Prop({
    required: false,
    type: Number,
  })
  damageBonus?: number;

  @Prop({
    required: false,
    type: Number,
  })
  pa?: number;

  @Prop({
    required: false,
    type: Number,
  })
  paMax?: number;

  @Prop({
    required: false,
    type: Number,
  })
  pm?: number;

  @Prop({
    required: false,
    type: Number,
  })
  pmMax?: number;

  @Prop({
    required: false,
    type: Object,
  })
  position?: { x: number; y: number };
}

export const CombatantSchema = SchemaFactory.createForClass(Combatant);
