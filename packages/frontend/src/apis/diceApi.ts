import type { DiceResultDto } from '@rpg-gen/shared';
import apiClient from './apiClient';

class DiceApi {
  public roll = async (
    expr: string,
    advantage?: 'advantage' | 'disadvantage' | 'none',
  ): Promise<DiceResultDto> => {
    const {
      data, error,
    } = await apiClient.POST('/api/dice', {
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
}

export const diceApi = new DiceApi();
