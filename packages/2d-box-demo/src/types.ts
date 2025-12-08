/**
 * Animation definition for a single animation type.
 */
export interface AnimationDef {
  /** Row index in the spritesheet (0-based) */
  row: number;
  /** Column indices for frames */
  cols: number[];
  /** Whether this animation loops */
  loop: boolean;
}

/**
 * Sprite manifest describing how to read a spritesheet.
 */
export interface SpriteManifest {
  frameWidth: number;
  frameHeight: number;
  rows: number;
  cols: number;
  frameRate: number;
  animations: Record<string, AnimationDef>;
}

/**
 * State for an active animation on a unit.
 */
export interface ActiveAnimationState {
  animationName: string;
  row: number;
  cols: number[];
  frameIndex: number;
  lastTs: number;
  frameRate: number;
  loop: boolean;
  startedAt: number;
  once: boolean;
}

/**
 * State for a floating damage/status popup.
 */
export interface PopupState {
  id: string;
  text: string;
  color: string;
  createdAt: number;
  offsetY: number;
  duration: number;
  scale: number;
}

/**
 * Attack result returned by the parent after processing an attack.
 */
export interface AttackResult {
  attackerId: string;
  targetId: string;
  attackType: string;
  hit: boolean;
  isCrit: boolean;
  damageTotal: number;
  targetHpBefore: number;
  targetHpAfter: number;
  targetDefeated: boolean;
}

/**
 * Represents a unit token on the combat grid.
 */
export interface UnitToken {
  /** Unique identifier for the unit */
  id: string;
  /** X coordinate on the grid (0-based) */
  x: number;
  /** Y coordinate on the grid (0-based) */
  y: number;
  /** Whether this unit is controlled by the player */
  isPlayer: boolean;
  /** Color of the token (CSS color string) — used for legacy/fallback */
  color?: string;
  /** Per-unit movement range (optional, falls back to grid's maxMoves) */
  moves?: number;

  // ─────────────────────────────────────────────────────────────
  // Sprite & Animation
  // ─────────────────────────────────────────────────────────────
  /** Path to the spritesheet image (required for sprite rendering) */
  spriteUrl: string;
  /** Width of a single frame in the spritesheet (default 32) */
  frameWidth?: number;
  /** Height of a single frame in the spritesheet (default 32) */
  frameHeight?: number;
  /** Number of rows in the spritesheet (default 8) */
  rows?: number;
  /** Number of columns in the spritesheet (default 24) */
  cols?: number;
  /** Animation frame rate in fps (default 8) */
  frameRate?: number;
  /** Custom animation definitions (overrides defaults) */
  animations?: Record<string, AnimationDef>;

  // ─────────────────────────────────────────────────────────────
  // Health & State
  // ─────────────────────────────────────────────────────────────
  /** Current hit points */
  hp?: number;
  /** Maximum hit points */
  hpMax?: number;
  /** Whether this unit is dead/defeated */
  isDead?: boolean;
}
