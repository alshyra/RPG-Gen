import axios from 'axios';
import type { DiceThrowDto } from '@rpg-gen/shared';

export const rollDice = async (expr: string): Promise<DiceThrowDto> => {
  const res = await axios.post<DiceThrowDto>('/api/dice', { expr });
  return res.data;
};
