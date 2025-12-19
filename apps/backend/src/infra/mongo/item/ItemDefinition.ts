import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import type { InventoryItemMeta } from "../../../domain/character/dto/InventoryItemMeta.js";

// Equipment slots for the new simplified system
export type ItemSlot = "head" | "body" | "weapon" | "accessory" | "consumable";

// Stat bonuses from equipment
export interface ItemBonuses {
  vigor?: number; // +HP, physical resistance
  finesse?: number; // +Crit, dodge
  mind?: number; // +Spell power, PM regen
  survival?: number; // +Healing, status resistance
  pa?: number; // +Action points
  pm?: number; // +Movement points
}

@Schema({ timestamps: true })
export class ItemDefinition {
  @Prop({
    required: true,
    unique: true,
  })
  definitionId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: "" })
  description: string;

  // Equipment slot (new simplified system)
  @Prop({
    type: String,
    enum: ["head", "body", "weapon", "accessory", "consumable"],
    required: false,
  })
  slot?: ItemSlot;

  // Stat bonuses from equipment
  @Prop({
    type: Object,
    default: {},
  })
  bonuses: ItemBonuses;

  // Tactical passive/active effect (e.g., "+1 range", "parry chance")
  @Prop({ type: String, default: "" })
  tacticalEffect: string;

  // Narrative description for Gemini AI
  @Prop({ type: String, default: "" })
  descriptionForAi: string;

  // Legacy meta field for backward compatibility
  @Prop({
    type: Object,
    default: {},
  })
  meta: InventoryItemMeta;

  @Prop({ default: true })
  isEditable: boolean;
}

export type ItemDefinitionDocument = ItemDefinition & Document;
export const ItemDefinitionSchema = SchemaFactory.createForClass(ItemDefinition);
