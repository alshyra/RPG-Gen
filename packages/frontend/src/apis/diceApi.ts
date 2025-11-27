import type { DiceThrowDto } from '@rpg-gen/shared';
import apiClient from './apiClient';

export const rollDice = async (
  expr: string,
  advantage?: 'advantage' | 'disadvantage' | 'none',
): Promise<DiceThrowDto> => {
  const { data, error } = await apiClient.POST('/api/dice', {
    body: {
      expr,
      advantage: advantage || 'none',
    },
  });

  if (error || !data) {
    throw new Error('Failed to roll dice');
  }

  return data;
};
