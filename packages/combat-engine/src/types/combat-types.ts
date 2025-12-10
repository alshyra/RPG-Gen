import * as PIXI from 'pixi.js';

export interface GridPosition {
  gridX: number;
  gridY: number;
}

export interface UnitConfig {
  id: string;
  characterKey: string;
  position: GridPosition;
  stats: UnitStats;
  team: 'player' | 'enemy';
  isPlayer?: boolean;
}

export interface UnitStats {
  hp: number;
  maxHp: number;
  ac: number;
  attack: number;
  defense: number;
  moveRange: number;
  attackRange: number;
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

export type CombatEvent =
  | { type: 'unit:moved'; unitId: string; from: GridPosition; to: GridPosition }
  | { type: 'unit:attacked'; attackerId: string; targetId: string; damage: number }
  | { type: 'unit:died'; unitId: string }
  | { type: 'turn:changed'; currentTurn: 'player' | 'enemy' }
  | { type: 'combat:ended'; winner: 'player' | 'enemy' };

export type availableCharacterKeys =
  | 'Archer-Green'
  | 'Archer-Purple'
  | 'Mage-Cyan'
  | 'Mage-Red'
  | 'Soldier-Blue'
  | 'Soldier-Red'
  | 'Soldier-Yellow'
  | 'Warrior-Blue'
  | 'Warrior-Red';

// Interface pour stocker les données d'unité
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
    text: PIXI.Text;
    update: (newHp: number) => void;
  };
}

// Configuration de la grille
export const GRID_CONFIG = {
  cellSize: 64,
  cols: 12,
  rows: 9,
  lineColor: 0x2d5016,
  lineAlpha: 0.6,
  tileColor1: 0x5a9c3f,
  tileColor2: 0x4a7c2f,
  reachableColor: 0xffd700,
  reachableAlpha: 0.4,
};

// Event types for external subscribers
export type CombatEngineEventType = 'unit:clicked' | 'unit:attacked' | 'unit:died' | 'turn:ended';

export interface UnitClickedPayload {
  unitId: string;
  isPlayer: boolean;
}

export interface UnitAttackedPayload {
  attackerId: string;
  targetId: string;
  damage: number;
  isCrit?: boolean;
}

export interface CombatEngineEventPayload {
  'unit:clicked': UnitClickedPayload;
  'unit:attacked': UnitAttackedPayload;
  'unit:died': { unitId: string };
  'turn:ended': { roundNumber: number };
}

export type EventHandler<T extends CombatEngineEventType> = (
  payload: CombatEngineEventPayload[T],
) => void;
