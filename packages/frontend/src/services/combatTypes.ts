/**
 * Combat system types for D&D 5e-style combat
 * Mirrors backend types for frontend use
 */

/**
 * Represents an enemy in combat
 */
export interface CombatEnemy {
  id: string;
  name: string;
  hp: number;
  hpMax: number;
  ac: number;
  initiative: number;
  attackBonus: number;
  damageDice: string;
  damageBonus: number;
}

/**
 * Represents the player in combat
 */
export interface CombatPlayer {
  characterId: string;
  name: string;
  hp: number;
  hpMax: number;
  ac: number;
  initiative: number;
  attackBonus: number;
  damageDice: string;
  damageBonus: number;
}

/**
 * Represents a combatant (either player or enemy) with initiative order
 */
export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  isPlayer: boolean;
}

/**
 * Result of a single attack action
 */
export interface AttackResult {
  attacker: string;
  target: string;
  attackRoll: number;
  attackBonus: number;
  totalAttack: number;
  targetAc: number;
  hit: boolean;
  critical: boolean;
  fumble: boolean;
  damageRoll: number[];
  damageBonus: number;
  totalDamage: number;
  targetHpBefore: number;
  targetHpAfter: number;
  targetDefeated: boolean;
}

/**
 * Result of a complete combat turn
 */
export interface TurnResult {
  turnNumber: number;
  roundNumber: number;
  playerAttacks: AttackResult[];
  enemyAttacks: AttackResult[];
  combatEnded: boolean;
  victory: boolean;
  defeat: boolean;
  remainingEnemies: CombatEnemy[];
  playerHp: number;
  playerHpMax: number;
  narrative: string;
}

/**
 * Enemy definition in combat start instruction
 */
export interface CombatStartEnemy {
  name: string;
  hp: number;
  ac: number;
  attack_bonus?: number;
  damage_dice?: string;
  damage_bonus?: number;
}

/**
 * Combat start instruction from Gemini
 */
export interface CombatStartInstruction {
  combat_start: CombatStartEnemy[];
}

/**
 * Combat end data
 */
export interface CombatEndData {
  victory: boolean;
  xp_gained: number;
  player_hp: number;
  enemies_defeated: string[];
  fled?: boolean;
}

/**
 * Combat end instruction
 */
export interface CombatEndInstruction {
  combat_end: CombatEndData;
}

/**
 * Type guard for combat start instruction
 */
export function isCombatStartInstruction(obj: unknown): obj is CombatStartInstruction {
  if (typeof obj !== 'object' || obj === null) return false;
  const record = obj as Record<string, unknown>;
  if (!Array.isArray(record.combat_start)) return false;

  return record.combat_start.every((enemy: unknown) => {
    if (typeof enemy !== 'object' || enemy === null) return false;
    const e = enemy as Record<string, unknown>;
    return typeof e.name === 'string'
      && typeof e.hp === 'number'
      && typeof e.ac === 'number';
  });
}

/**
 * Type guard for combat end instruction
 */
export function isCombatEndInstruction(obj: unknown): obj is CombatEndInstruction {
  if (typeof obj !== 'object' || obj === null) return false;
  const record = obj as Record<string, unknown>;
  if (typeof record.combat_end !== 'object' || record.combat_end === null) return false;

  const combatEnd = record.combat_end as Record<string, unknown>;
  return typeof combatEnd.victory === 'boolean'
    && typeof combatEnd.xp_gained === 'number'
    && typeof combatEnd.player_hp === 'number'
    && Array.isArray(combatEnd.enemies_defeated);
}
