import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument } from "mongoose";
import { RaceBonuses } from "./RaceBonuses.js";

export type RaceDocument = HydratedDocument<Race>;

import type { TraitEffectData } from "./TraitEffect.js";

/**
 * Race schema - simplified system with 4 races
 * Each race has stat bonuses and a unique racial trait
 */
@Schema({ collection: "races", timestamps: true })
export class Race extends Document {
  @Prop({ required: true, unique: true, index: true })
  raceId!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ type: RaceBonuses, default: {} })
  bonuses!: RaceBonuses;

  @Prop({ required: true })
  trait!: string;

  @Prop({ type: Object, required: true })
  traitEffect!: TraitEffectData;

  @Prop()
  descriptionForAi?: string;

  @Prop()
  icon?: string;

  @Prop()
  color?: string;
}

export const RaceSchema = SchemaFactory.createForClass(Race);
