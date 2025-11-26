/**
 * Combat system types for D&D 5e-style combat
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
 * Combat state for a character session
 */
export interface CombatState {
  characterId: string;
  inCombat: boolean;
  enemies: CombatEnemy[];
  player: CombatPlayer;
  turnOrder: Combatant[];
  currentTurnIndex: number;
  roundNumber: number;
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
 * Combat start instruction from Gemini
 */
export interface CombatStartInstruction {
  combat_start: {
    name: string;
    hp: number;
    ac: number;
    attack_bonus?: number;
    damage_dice?: string;
    damage_bonus?: number;
  }[];
}

/**
 * Combat end result
 */
export interface CombatEndResult {
  combat_end: {
    victory: boolean;
    xp_gained: number;
    player_hp: number;
    enemies_defeated: string[];
    narrative: string;
  };
}
