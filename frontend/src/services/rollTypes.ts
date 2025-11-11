/**
 * Common roll data structures used across the app
 */

export interface RollResult {
  diceValue: number;      // Raw d20 result (1-20)
  modifier: number;       // Ability/skill modifier
  total: number;          // diceValue + modifier
  diceNotation?: string;  // e.g. "1d20"
  skillName?: string;     // e.g. "Persuasion"
  isCritical?: boolean;   // true if nat 20 or nat 1
  isNat20?: boolean;      // Specifically nat 20
  isNat1?: boolean;       // Specifically nat 1
}

export interface RollModalData {
  diceNotation: string;
  diceValue: number;
  rolls: number[];        // For display (array of individual die rolls)
  modifier: number;
  total: number;
}
