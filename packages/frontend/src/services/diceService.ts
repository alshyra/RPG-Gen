import axios from 'axios';
import type { DiceThrowDto } from '@rpg-gen/shared';

export const rollDice = async (
  expr: string,
  advantage?: 'advantage' | 'disadvantage' | 'none',
): Promise<DiceThrowDto> => {
  const res = await axios.post<DiceThrowDto>('/api/dice', {
    expr,
    advantage: advantage || 'none',
  });
  return res.data;
};
