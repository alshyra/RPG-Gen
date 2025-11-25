import type { DiceThrowDto } from '@rpg-gen/shared';
import apiClient from './axiosClient';

export const rollDice = async (
  expr: string,
  advantage?: 'advantage' | 'disadvantage' | 'none',
): Promise<DiceThrowDto> => {
  const res = await apiClient.post<DiceThrowDto>('/dice', {
    expr,
    advantage: advantage || 'none',
  });
  return res.data;
};
