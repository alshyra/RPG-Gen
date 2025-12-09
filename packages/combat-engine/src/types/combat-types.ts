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

export type CombatEvent
  = | { type: 'unit:moved'; unitId: string; from: GridPosition; to: GridPosition }
    | { type: 'unit:attacked'; attackerId: string; targetId: string; damage: number }
    | { type: 'unit:died'; unitId: string }
    | { type: 'turn:changed'; currentTurn: 'player' | 'enemy' }
    | { type: 'combat:ended'; winner: 'player' | 'enemy' };
