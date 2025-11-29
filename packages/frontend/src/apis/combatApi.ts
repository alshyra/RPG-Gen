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
    // Debug: log payload being sent to backend
    try {
      console.log('[combatApi] startCombat body', combatStart);
      console.log('[combatApi] startCombat JSON', JSON.stringify(combatStart));
    } catch (e) {
      console.log('[combatApi] startCombat - serialization error', e);
    }
    const response = await api.POST('/api/combat/{characterId}/start', {
      params: { path: { characterId } },
      body: combatStart as any,
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

  /**
   * Submit a resolved damage roll from the client so the server can apply it persistently
   */
  async resolveRoll(characterId: string, payload: { action: string; target?: string; total?: number }) {
    const response = await api.POST('/api/combat/{characterId}/resolve-roll', {
      params: { path: { characterId } },
      body: payload as any,
    });
    return getData<any>(response);
  }
}

export const combatService = new CombatService();
