export class DiceThrowDto {
  rolls: number[];
  mod: number;
  total: number;
  advantage?: 'advantage' | 'disadvantage' | 'none';
  keptRoll?: number;
  discardedRoll?: number;
}
