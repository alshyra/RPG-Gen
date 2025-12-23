/**
 * GameInstruction interface (domain-level, without Mongoose decorators)
 * Used in the domain layer to represent game instructions
 */
export interface GameInstructionDto {
  type: 'roll' | 'xp' | 'hp' | 'spell' | 'inventory' | 'combat_start' | 'combat_end';
  dices?: string;
  modifierLabel?: string;
  modifierValue?: number;
  spellName?: string;
  spellCost?: number;
  spellRange?: number;
  spellSave?: string;
  spellEffect?: string;
  amount?: number;
  itemId?: string;
  itemName?: string;
  quantity?: number;
  combatStartData?: any;
  combatEndData?: any;
  data?: any; // Generic data field for flexible instruction payloads
}
