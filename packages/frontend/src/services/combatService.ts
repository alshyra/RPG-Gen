/**
 * Combat service for interacting with the backend combat API
 */
import { CombatStartRequestDto } from '@rpg-gen/shared';
import apiClient from '../apis/apiClient';

class CombatService {
  /**
   * Start combat with the given enemies
   */
  async startCombat(
    characterId: string,
    combatStart: CombatStartRequestDto,
  ) {
    await apiClient.POST('/api/combat/{characterId}/start', {
      params: { path: { characterId } },
      body: combatStart,
    });
    return true;
  }

  /**
   * Execute an attack against a target
   */
  async attack(characterId: string, target: string) {
    await apiClient.POST('/api/combat/{characterId}/attack', {
      params: { path: { characterId } },
      body: { target },
    });
    return true;
  }

  /**
   * Get current combat status
   */
  async getStatus(characterId: string) {
    const response = await apiClient.GET('/api/combat/{characterId}/status', {
      params: { path: { characterId } },
    });
    return response.data;
  }

  /**
   * End combat (flee)
   */
  async endCombat(characterId: string) {
    const response = await apiClient.POST('/api/combat/{characterId}/end', {
      params: { path: { characterId } },
      // `/combat/${characterId}/end`,
    });
    return response.data;
  }
}

export const combatService = new CombatService();
