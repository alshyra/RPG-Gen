// GENERATED FROM backend - do not edit manually


export interface DiceThrowDto {
  rolls: number[];
  mod: number;
  total: number;
  advantage?: 'advantage' | 'disadvantage' | 'none';
  keptRoll?: number;
  discardedRoll?: number;
}
