/**
 * Combat service for interacting with the backend combat API
 */
import type {
  AttackResponseDto,
  CombatEndResponseDto,
  CombatStartRequestDto,
  CombatStateDto,
  CombatantDto,
} from '@rpg-gen/shared';
import { api } from './apiClient';

function getData<T>(response: { data?: T; error?: unknown }): T {
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
  async attack(
    characterId: string,
    target: CombatantDto,
    spellName?: string,
  ): Promise<AttackResponseDto> {
    // Validate inputs
    if (!characterId) {
      throw new Error('combatApi.attack: characterId is required');
    }
    if (!target?.id) {
      throw new Error('combatApi.attack: target and target.id are required');
    }

    try {
      const response = await api.POST('/api/combat/{characterId}/attack', {
        params: {
          path: {
            characterId,
          },
        },
        body: {
          targetId: target.id,
          ...(spellName && { spellName }),
        },
      });

      if (response.error) {
        const errorMsg =
          response.error instanceof Error ? response.error.message : String(response.error);
        throw new Error(
          `combatApi.attack failed (characterId=${characterId}, targetId=${target.id}): ${errorMsg}`,
        );
      }

      if (!response.data) {
        throw new Error(
          `combatApi.attack: no data in response (characterId=${characterId}, targetId=${target.id})`,
        );
      }

      return response.data;
    } catch (err) {
      // Re-throw with context if not already a contextualized error
      if (err instanceof Error && err.message.includes('combatApi.attack')) {
        throw err;
      }
      const errorMsg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `combatApi.attack: unexpected error (characterId=${characterId}, targetId=${target.id}): ${errorMsg}`,
      );
    }
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
    const response = await api.POST('/api/combat/{characterId}/flee', {
      params: { path: { characterId } },
    });
    return getData(response);
  }

  /**
   * End the current player activation and advance to next turn.
   * This triggers enemy actions automatically until the next player activation.
   */
  async endActivation(characterId: string) {
    const response = await api.POST('/api/combat/{characterId}/end-turn', {
      params: { path: { characterId } },
    });
    return getData(response);
  }
}

export const combatService = new CombatService();
