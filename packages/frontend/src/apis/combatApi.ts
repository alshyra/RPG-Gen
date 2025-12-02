/**
 * Combat service for interacting with the backend combat API
 */
import type {
  CombatStartRequestDto, CombatStateDto, TurnResultWithInstructionsDto, CombatEndResponseDto, DiceThrowDto,
  CombatEnemyDto,
} from '@rpg-gen/shared';
import { api } from './apiClient';

function getData<T>(response: { data?: T;
  error?: unknown; }): T {
  if (response.error) throw response.error;
  if (!response.data) throw new Error('No data in response');
  return response.data;
}

class CombatService {
  /**
   * Start combat with the given enemies
   */
  async startCombat(
    characterId: string,
    combatStart: CombatStartRequestDto,
  ): Promise<CombatStateDto> {
    console.log('[combatApi] startCombat body', combatStart);
    const response = await api.POST('/api/combat/{characterId}/start', {
      params: { path: { characterId } },
      body: combatStart,
    });
    return getData<CombatStateDto>(response);
  }

  /**
   * Execute an attack against a target using an action token for idempotency
   */
  async attackWithToken(characterId: string, actionToken: string, target: CombatEnemyDto): Promise<TurnResultWithInstructionsDto> {
    const response = await api.POST('/api/combat/{characterId}/attack/{actionToken}', {
      params: {
        path: {
          characterId,
          actionToken,
        },
      },
      body: { targetId: target.id },
    });
    return getData<TurnResultWithInstructionsDto>(response);
  }

  /**
   * Get current combat status (includes actionToken for next action)
   */
  async getStatus(characterId: string): Promise<CombatStateDto> {
    const response = await api.GET('/api/combat/{characterId}/status', { params: { path: { characterId } } });
    return getData<CombatStateDto>(response);
  }

  /**
   * End combat (flee)
   */
  async endCombat(characterId: string): Promise<CombatEndResponseDto> {
    const response = await api.POST('/api/combat/{characterId}/end', { params: { path: { characterId } } });
    return getData<CombatEndResponseDto>(response);
  }

  /**
   * Submit a resolved damage roll using action token for idempotency
   */
  async resolveRollWithToken(
    characterId: string,
    actionToken: string,
    payload: DiceThrowDto,
  ): Promise<TurnResultWithInstructionsDto> {
    const response = await api.POST('/api/combat/{characterId}/resolve-roll/{actionToken}', {
      params: {
        path: {
          characterId,
          actionToken,
        },
      },
      body: payload,
    });
    return getData<TurnResultWithInstructionsDto>(response);
  }
}

export const combatService = new CombatService();
