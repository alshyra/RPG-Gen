import * as PIXI from "pixi.js";
import type { components } from "@rpg-gen/shared";

// ===== Re-export backend DTOs as base types =====
export type CombatantDto = components["schemas"]["CombatantDto"];
export type GridPositionDto = components["schemas"]["GridPositionDto"];
export type MovementResponseDto = components["schemas"]["MovementResponseDto"];
export type MovementEventDto = components["schemas"]["MovementEventDto"];

// ===== Engine-specific extensions (for runtime PIXI needs) =====

/**
 * GridPosition with engine-friendly naming (gridX/gridY).
 * Maps to backend GridPositionDto (x/y).
 */
export interface GridPosition {
  gridX: number;
  gridY: number;
}

/**
 * UnitConfig for engine initialization - extends backend CombatantDto
 * with engine-specific fields (characterKey for asset loading).
 */
export interface UnitConfig {
  id: string;
  characterKey: string;
  position: GridPosition;
  stats: UnitStats;
  team: "player" | "enemy";
  isPlayer?: boolean;
}

/**
 * UnitStats for the engine - subset of CombatantDto fields.
 */
export interface UnitStats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  moveRange: number;
  attackRange: number;
  // New tactical system resources
  pa?: number; // Current action points
  paMax?: number; // Maximum action points
  pm?: number; // Current movement points
  pmMax?: number; // Maximum movement points
}

export interface CombatConfig {
  gridSize: {
    cols: number;
    rows: number;
    cellSize: number;
  };
  units: UnitConfig[];
  turnBased: boolean;
}

/**
 * Internal combat events (for engine state management).
 * These are different from backend MovementEventDto / combat events.
 */
export type CombatEvent =
  | { type: "unit:moved"; unitId: string; from: GridPosition; to: GridPosition }
  | { type: "unit:attacked"; attackerId: string; targetId: string; damage: number }
  | { type: "unit:died"; unitId: string }
  | { type: "turn:changed"; currentTurn: "player" | "enemy" }
  | { type: "combat:ended"; winner: "player" | "enemy" };

export type availableCharacterKeys =
  | "Archer-Green"
  | "Archer-Purple"
  | "Mage-Cyan"
  | "Mage-Red"
  | "Soldier-Blue"
  | "Soldier-Red"
  | "Soldier-Yellow"
  | "Warrior-Blue"
  | "Warrior-Red";

/**
 * Runtime unit data (PIXI-specific, not from backend).
 * Contains sprite references and visual state.
 */
export interface UnitData {
  sprite: PIXI.AnimatedSprite;
  animations: Record<string, PIXI.Texture[]>;
  gridX: number;
  gridY: number;
  maxMoveRange: number;
  hp: number;
  maxHp: number;
  healthBar: {
    container: PIXI.Container;
    bg: PIXI.Graphics;
    fill: PIXI.Graphics;
    text: PIXI.BitmapText;
    update: (newHp: number) => void;
  };
}

// Configuration de la grille (fake isometric)
export const GRID_CONFIG = {
  cellSize: 64, // base cell size (used for unit spacing logic)
  cols: 20,
  rows: 20,
  // Isometric tile dimensions (2:1 ratio for fake isometric)
  tileWidth: 96,
  tileHeight: 48,
  // Offset to center the grid in the canvas (800x600)
  originX: 400,
  originY: -150,
  lineColor: 0x2d5016,
  lineAlpha: 0.6,
  tileColor1: 0x5a9c3f,
  tileColor2: 0x4a7c2f,
  reachableColor: 0xffd700,
  reachableAlpha: 0.4,
};

// Event types for external subscribers
export type CombatEngineEventType =
  | "unit:clicked"
  | "unit:attacked"
  | "unit:died"
  | "unit:moved"
  | "turn:ended";

export interface UnitClickedPayload {
  unitId: string;
  isPlayer: boolean;
  stageX: number;
  stageY: number;
}

export interface UnitMovedPayload {
  unitId: string;
  fromGridX: number;
  fromGridY: number;
  gridX: number;
  gridY: number;
  pmCost: number; // Movement points consumed
}

export interface UnitAttackedPayload {
  attackerId: string;
  targetId: string;
  damage: number;
  isCrit?: boolean;
}

export interface CombatEngineEventPayload {
  "unit:clicked": UnitClickedPayload;
  "unit:attacked": UnitAttackedPayload;
  "unit:died": { unitId: string };
  "unit:moved": UnitMovedPayload;
  "turn:ended": { roundNumber: number };
}

export type EventHandler<T extends CombatEngineEventType> = (
  payload: CombatEngineEventPayload[T],
) => void;
