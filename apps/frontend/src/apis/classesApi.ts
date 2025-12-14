import type { LevelUpOptionsDto } from '@rpg-gen/shared';
import { api } from './apiClient';

const getData = <T>(res: { data?: T; error?: unknown }): T => {
  if (res.error) throw res.error;
  return res.data as T;
};

export const classesApi = {
  /**
   * Fetch class-level options for a specific level (no character required)
   * GET /api/classes/{className}/levels/{level}
   */
  getLevelOptions: async (className: string, level: number): Promise<LevelUpOptionsDto> => {
    const res = await api.GET('/api/classes/{className}/levels/{level}', {
      params: {
        path: {
          className,
          level,
        },
      },
    });
    return getData(res);
  },
};

export default classesApi;
