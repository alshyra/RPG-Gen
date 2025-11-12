/**
 * Roll instruction received from backend
 */
export interface RollInstruction {
  dices: string;           // e.g. "1d20"
  modifier: string;        // e.g. "Perception Check" - skill/check name
}

/**
 * Roll result sent to backend
 */
export interface RollResult {
  rolls: number[];         // Array of individual die rolls (e.g. [18] for d20)
  total: number;           // Sum of rolls + bonus
  bonus: number;           // Skill/ability modifier applied
  advantage: boolean;      // Always false for now
}

/**
 * Roll data for display in modal
 */
export interface RollModalData {
  skillName: string;       // Name of the skill/check (e.g. "Perception Check")
  diceNotation: string;    // e.g. "1d20"
  rolls: number[];         // Array of dice rolls
  bonus: number;           // Skill bonus
  total: number;           // final total (rolls sum + bonus)
}
