import { Prop, Schema } from "@nestjs/mongoose";
import { Schema as MongooseSchema, Document } from "mongoose";
import { Race } from "./Race.js";
import { CharacterClass } from "./CharacterClass.js";
import { AbilityScores } from "./AbilityScores.js";
import { Skill } from "./Skill.js";
import { Item } from "../item/Item.js";
import { Spell } from "../spell/Spell.js";

// Simplified stats for the new talent system
export interface CharacterStats {
  vigor: number; // Physical power, HP bonus
  finesse: number; // Crit, dodge
  mind: number; // Spell power, PM regen
  survival: number; // Healing, status resistance
}

// Unlocked talent rank in a voie
export interface UnlockedRank {
  voieId: string; // e.g., "voie_protection"
  rank: number; // 1-5
}

// Instance of an aptitude on a character (with current cooldown state)
export interface CharacterAptitude {
  aptitudeId: string;
  currentCooldown: number; // Turns remaining before reuse
}

@Schema({ timestamps: true })
export class Character {
  @Prop({
    required: false,
    type: MongooseSchema.Types.ObjectId,
    ref: "User",
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({
    required: true,
    type: String,
  })
  characterId: string;

  @Prop({
    required: false,
    type: String,
  })
  name: string;

  @Prop({
    required: false,
    type: String,
  })
  physicalDescription: string;

  // NEW: Simple class name (guerrier, rogue, mage)
  @Prop({
    required: false,
    type: String,
  })
  className: string;

  // NEW: Race (humain, nain, elfe, orc)
  @Prop({
    required: false,
    type: String,
  })
  raceId: string;

  // NEW: Computed/base stats for the simplified system
  @Prop({
    type: Object,
    required: false,
  })
  stats: CharacterStats;

  // NEW: Resource pools
  @Prop({
    required: false,
    type: Number,
    default: 6,
  })
  pa: number; // Current action points

  @Prop({
    required: false,
    type: Number,
    default: 6,
  })
  paMax: number; // Max action points

  @Prop({
    required: false,
    type: Number,
    default: 4,
  })
  pm: number; // Current movement points

  @Prop({
    required: false,
    type: Number,
    default: 4,
  })
  pmMax: number; // Max movement points

  // NEW: Talent progression
  @Prop({
    required: false,
    type: Number,
    default: 0,
  })
  talentPoints: number; // Unspent talent points

  @Prop({
    type: [Object],
    required: false,
    default: [],
  })
  unlockedRanks: UnlockedRank[]; // Unlocked talent tree ranks

  // NEW: Character aptitudes (unlocked abilities)
  @Prop({
    type: [Object],
    required: false,
    default: [],
  })
  aptitudes: CharacterAptitude[];

  // LEGACY: Keep for migration, will be deprecated
  @Prop({
    type: Race,
    required: false,
  })
  race: Race;

  // LEGACY: D&D ability scores - will be deprecated
  @Prop({
    type: AbilityScores,
    required: false,
  })
  scores: AbilityScores;

  @Prop({
    required: false,
    type: Number,
  })
  hp: number;

  @Prop({
    required: false,
    type: Number,
  })
  hpMax: number;

  @Prop({
    required: false,
    default: 0,
    type: Number,
  })
  totalXp: number;

  // LEGACY: D&D multiclass - will be deprecated
  @Prop({
    type: [CharacterClass],
    required: false,
  })
  classes: CharacterClass[];

  // LEGACY: D&D skills - will be deprecated
  @Prop({
    type: [Skill],
    required: false,
  })
  skills: Skill[];

  @Prop({
    required: true,
    type: String,
  })
  world: string;

  @Prop({ type: String })
  portrait: string;

  @Prop({
    required: false,
    type: String,
  })
  gender: string;

  // LEGACY: D&D proficiency - will be deprecated
  @Prop({
    required: false,
    default: 2,
    type: Number,
  })
  proficiency: number;

  @Prop({
    required: false,
    default: 1,
    type: Number,
  })
  inspirationPoints: number;

  @Prop({
    default: false,
    type: Boolean,
  })
  isDeceased: boolean;

  @Prop({ type: Date })
  diedAt: Date;

  @Prop({ type: String })
  deathLocation: string;

  @Prop({
    required: true,
    default: "draft",
    type: String,
  })
  state: "draft" | "created";

  @Prop({
    type: [Item],
    required: false,
    default: [],
  })
  inventory: Item[];

  // LEGACY: D&D spells - will be replaced by aptitudes
  @Prop({
    type: [Spell],
    required: false,
    default: [],
  })
  spells: Spell[];

  // LEGACY: D&D combat proficiencies - will be deprecated
  @Prop({
    type: [String],
    required: false,
    default: [],
  })
  selectedCombatProficiencies: string[];

  // Character level (1-20, simplified progression)
  @Prop({
    required: false,
    default: 1,
    type: Number,
  })
  level: number;
}

export type CharacterDocument = Character & Document;
