/**
 * Combat service for interacting with the backend combat API
 */
import type { CombatStartRequestDto, CombatStateDto, TurnResultWithInstructionsDto, CombatEndResponseDto } from '@rpg-gen/shared';
import { api } from './apiClient';

const getData = <T>(response: { data?: T; error?: unknown }): T => {
  if (response.error) throw response.error;
  return response.data as T;
};

class CombatService {
  /**
   * Start combat with the given enemies
   */
  async startCombat(
    characterId: string,
    combatStart: CombatStartRequestDto,
  ): Promise<CombatStateDto> {
    const response = await api.POST('/api/combat/{characterId}/start', {
      params: { path: { characterId } },
      body: combatStart,
    });
    return getData<CombatStateDto>(response);
  }

  /**
   * Execute an attack against a target
   */
  async attack(characterId: string, target: string): Promise<TurnResultWithInstructionsDto> {
    const response = await api.POST('/api/combat/{characterId}/attack', {
      params: { path: { characterId } },
      body: { target },
    });
    return getData<TurnResultWithInstructionsDto>(response);
  }

  /**
   * Get current combat status
   */
  async getStatus(characterId: string): Promise<CombatStateDto> {
    const response = await api.GET('/api/combat/{characterId}/status', {
      params: { path: { characterId } },
    });
    return getData<CombatStateDto>(response);
  }

  /**
   * End combat (flee)
   */
  async endCombat(characterId: string): Promise<CombatEndResponseDto> {
    const response = await api.POST('/api/combat/{characterId}/end', {
      params: { path: { characterId } },
    });
    return getData<CombatEndResponseDto>(response);
  }
}

export const combatService = new CombatService();
