import type { SubmitRollDto } from '@rpg-gen/shared';
import { api } from './apiClient';

class RollsService {
  async submitRoll(characterId: string, submitRollDto: SubmitRollDto) {
    const { data } = await api.POST('/api/rolls/{characterId}', {
      params: { path: { characterId } },
      body: submitRollDto,
    });

    return data;
  }
}

export const rollsService = new RollsService();
