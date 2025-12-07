import type { LevelUpApplyDto, CharacterResponseDto } from '@rpg-gen/shared';
import { api } from './apiClient';

const getData = <T>(res: { data?: T;
  error?: unknown; }): T => {
  if (res.error) throw res.error;
  return res.data as T;
};

export const levelUpApi = {
  applyLevelUp: async (characterId: string, className: string, payload: LevelUpApplyDto): Promise<CharacterResponseDto> => {
    const res = await api.POST('/api/characters/{characterId}/levelup/{className}', {
      params: {
        path: {
          characterId,
          className,
        },
      },
      body: payload,
    });
    return getData(res);
  },
};

export default levelUpApi;
