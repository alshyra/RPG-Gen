import type { LevelUpOptionsDto } from '@rpg-gen/shared';
import { apiClient, getData } from './index.js';

export const classesApi = {
  /**
   * Get level up options for a class at a specific level
   */
  async getLevelOptions(className: string, level: number): Promise<LevelUpOptionsDto> {
    const response = await apiClient.GET('/api/classes/{className}/levels/{level}', {
      params: { path: { className, level } },
    });
    return getData(response);
  },
};
