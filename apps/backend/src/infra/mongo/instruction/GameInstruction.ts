import { Prop, Schema } from "@nestjs/mongoose";
import { CombatStartEntry } from "../../../bounded-contexts/combat/infrastructure/persistence/mongo/schemas/CombatStartEntry.js";
import { CombatEnd } from "../../../bounded-contexts/combat/infrastructure/persistence/mongo/schemas/CombatEnd.js";

@Schema({ _id: false })
export class GameInstruction {
  @Prop({
    required: false,
    type: String,
    enum: ["roll", "xp", "hp", "spell", "inventory", "combat_start", "combat_end"],
  })
  type: "roll" | "xp" | "hp" | "spell" | "inventory" | "combat_start" | "combat_end";

  @Prop({
    required: false,
    type: String,
  })
  dices?: string;

  @Prop({
    required: false,
    type: String,
  })
  modifierLabel?: string;

  @Prop({
    required: false,
    type: Number,
  })
  modifierValue?: number;

  @Prop({
    required: false,
    type: String,
  })
  description?: string;

  @Prop({
    required: false,
    type: String,
    enum: ["advantage", "disadvantage", "none"],
  })
  advantage?: "advantage" | "disadvantage" | "none";

  @Prop({
    required: false,
    type: Number,
  })
  hp?: number;

  @Prop({
    required: false,
    type: Number,
  })
  xp?: number;

  @Prop({
    required: false,
    type: String,
    enum: ["learn", "cast", "forget", "add", "remove", "use"],
  })
  action?: "learn" | "cast" | "forget" | "add" | "remove" | "use";

  @Prop({
    required: false,
    type: String,
  })
  name?: string;

  @Prop({
    required: false,
    type: Number,
  })
  level?: number;

  @Prop({
    required: false,
    type: String,
  })
  school?: string;

  @Prop({
    required: false,
    type: Number,
  })
  quantity?: number;

  @Prop({
    required: false,
    type: [CombatStartEntry],
  })
  combat_start?: CombatStartEntry[];

  @Prop({
    required: false,
    type: CombatEnd,
  })
  combat_end?: CombatEnd;
}
