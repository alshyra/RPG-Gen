import { SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Character } from "./character/Character.js";
export { CharacterClass } from "./character/CharacterClass.js";
export { Item } from "./item/Item.js";
export { ItemDefinition, ItemDefinitionSchema, type ItemSlot, type ItemBonuses } from "./item/ItemDefinition.js";
export { Race } from "./character/Race.js";
export { Skill } from "./character/Skill.js";
export {
  ClassDefinition,
  ClassDefinitionSchema,
} from "./class/index.js";
export { Aptitude, AptitudeSchema, type AptitudeTargetType, type AptitudeCategory, type AptitudeScaling } from "./aptitude/index.js";
export { CombatEnd } from "./combat/CombatEnd.js";
export { CombatStartEntry } from "./combat/CombatStartEntry.js";
export { Combatant, CombatantSchema } from "./combat/Combatant.js";
export { CombatSession, CombatSessionSchema } from "./combat/CombatSession.js";
export { Character } from "./character/Character.js";
export { ChatHistory, ChatHistorySchema } from "./chat/ChatHistory.js";
export { ChatMessage } from "./chat/ChatMessage.js";
export { GameInstruction } from "./instruction/GameInstruction.js";
export { RollInstruction } from "./instruction/RollInstruction.js";
export { InventoryInstruction } from "./instruction/InventoryInstruction.js";

export type CharacterDocument = Character & Document;

export const CharacterSchema = SchemaFactory.createForClass(Character);

// Index for efficient querying
CharacterSchema.index({
  userId: 1,
  characterId: 1,
});
CharacterSchema.index({
  userId: 1,
  isDeceased: 1,
});
