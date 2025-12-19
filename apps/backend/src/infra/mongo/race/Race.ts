import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument } from "mongoose";

export type RaceDocument = HydratedDocument<Race>;

/**
 * Race bonuses applied to character stats
 */
export class RaceBonuses {
  @Prop({ default: 0 })
  vigor?: number;

  @Prop({ default: 0 })
  finesse?: number;

  @Prop({ default: 0 })
  mind?: number;

  @Prop({ default: 0 })
  survival?: number;
}

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

  @Prop({ required: true })
  traitEffect!: string;

  @Prop()
  descriptionForAi?: string;

  @Prop()
  icon?: string;

  @Prop()
  color?: string;
}

export const RaceSchema = SchemaFactory.createForClass(Race);
