import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { type StatAttribute } from "../../../bounded-contexts/character/api/dto/response/StatAttribute.js";

// Target types for aptitudes
export type AptitudeTargetType = "self" | "enemy" | "ally" | "zone" | "all_enemies" | "all_allies";

// Aptitude categories
export type AptitudeCategory = "attack" | "defense" | "support" | "movement" | "utility";

// Scaling configuration
export interface AptitudeScaling {
  // Attribute that affects power (vigor, finesse, mind, survival)
  attribute?: StatAttribute;
  // Base formula: value = base + floor(level / scalingDivisor)
  scalingDivisor: number; // Default 5 means +1 every 5 levels
}

@Schema({ timestamps: true })
export class Aptitude {
  @Prop({ required: true, unique: true })
  aptitudeId: string; // e.g., "frappe_puissante", "boule_de_feu"

  @Prop({ required: true })
  name: string; // Display name

  @Prop({ required: true })
  description: string; // Tactical description (what it does mechanically)

  @Prop({ type: String, default: "" })
  descriptionForAi: string; // Narrative description for Gemini

  // Resource costs
  @Prop({ required: true, default: 1 })
  paCost: number; // Action points cost (1-5)

  @Prop({ default: 0 })
  pmCost: number; // Movement points cost (for movement abilities)

  // Cooldown
  @Prop({ default: 0 })
  cooldown: number; // Turns before reuse (0 = no cooldown)

  // Targeting
  @Prop({
    type: String,
    enum: ["self", "enemy", "ally", "zone", "all_enemies", "all_allies"],
    default: "enemy",
  })
  targetType: AptitudeTargetType;

  @Prop({ default: 1 })
  range: number; // Range in tiles (1 = melee)

  @Prop({ default: 0 })
  areaOfEffect: number; // 0 = single target, >0 = radius

  // Category for UI grouping
  @Prop({
    type: String,
    enum: ["attack", "defense", "support", "movement", "utility"],
    default: "attack",
  })
  category: AptitudeCategory;

  // Base power (damage, healing, shield amount, etc.)
  @Prop({ default: 0 })
  basePower: number;

  // Scaling configuration
  @Prop({
    type: Object,
    default: { scalingDivisor: 5 },
  })
  scaling: AptitudeScaling;

  // Status effects applied
  @Prop({ type: [String], default: [] })
  appliesStatus: string[]; // e.g., ["poison", "stun", "slow"]

  @Prop({ default: 0 })
  statusDuration: number; // Turns the status lasts

  // Class restriction (optional)
  @Prop({ type: String })
  classRestriction?: string; // "guerrier", "rogue", "mage" or undefined for universal

  // Voie/Rank requirement (filled when aptitude is part of a talent tree)
  @Prop({ type: String })
  voieId?: string; // Which voie this belongs to

  @Prop({ type: Number })
  rankRequired?: number; // Minimum rank to unlock (1-5)

  // Is this a starting aptitude (given at character creation)?
  @Prop({ default: false })
  isStarting: boolean;
}

export type AptitudeDocument = Aptitude & Document;
export const AptitudeSchema = SchemaFactory.createForClass(Aptitude);
