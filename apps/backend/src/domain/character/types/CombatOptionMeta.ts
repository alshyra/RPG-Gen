export interface SneakAttackMeta {
  kind: "sneak-attack";
  dice: string; // e.g. '1d6'
  scaling?: string[]; // per-level dice strings
}

export interface SteadyAimMeta {
  kind: "steady-aim";
  uses?: string; // e.g. 'at-will' | 'once-per-short-rest'
  requiresNoMovement?: boolean;
}

export interface CunningStrikeMeta {
  kind: "cunning-strike";
  effects: string[];
  costPerEffect?: string;
}

export type CombatOptionMeta =
  | SneakAttackMeta
  | SteadyAimMeta
  | CunningStrikeMeta
  | Record<string, unknown>;

export default CombatOptionMeta;
