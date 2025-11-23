// Shared DTO describing a dice throw result
export interface DiceThrowDto {
  /** Individual dice rolls, e.g. [17] or [3,5] */
  rolls: number[];
  /** Static modifier parsed from dice expression (e.g. +2 from "1d20+2") */
  mod: number;
  /** Total = sum(rolls) + mod */
  total: number;
}
