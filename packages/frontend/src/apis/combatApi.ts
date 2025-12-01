/**
 * Combat service for interacting with the backend combat API
 */
import type {
  CombatStartRequestDto, CombatStateDto, TurnResultWithInstructionsDto, CombatEndResponseDto, DiceThrowDto,
} from '@rpg-gen/shared';
import { api } from './apiClient';

// Extended combat state type with new fields (until shared package is regenerated)
export interface ExtendedCombatStateDto extends CombatStateDto {
  phase?: 'PLAYER_TURN' | 'AWAITING_DAMAGE_ROLL' | 'ENEMY_TURN' | 'COMBAT_ENDED';
  actionToken?: string;
  expectedDto?: string;
}

const getData = <T>(response: {
  data?: T;
  error?: unknown;
}): T => {
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
  ): Promise<ExtendedCombatStateDto> {
    // Debug: log payload being sent to backend
    try {
      console.log('[combatApi] startCombat body', combatStart);
      console.log('[combatApi] startCombat JSON', JSON.stringify(combatStart));
    } catch (e) {
      console.log('[combatApi] startCombat - serialization error', e);
    }
    const response = await api.POST('/api/combat/{characterId}/start', {
      params: { path: { characterId } },
      body: combatStart,
    });
    return getData<ExtendedCombatStateDto>(response);
  }

  /**
   * Execute an attack against a target using an action token for idempotency
   */
  async attackWithToken(characterId: string, actionToken: string, target: string): Promise<TurnResultWithInstructionsDto> {
    // Use fetch directly for tokenized endpoint since openapi-fetch doesn't know about it yet
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const resp = await fetch(`${baseUrl}/api/combat/${characterId}/attack/${actionToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({ target }),
    });
    if (!resp.ok) {
      const error = await resp.json()
        .catch(() => ({ message: resp.statusText }));
      throw new Error(error.message || resp.statusText);
    }
    return resp.json();
  }

  /**
   * Legacy attack without token (will be deprecated)
   * @deprecated Use attackWithToken instead
   */
  async attack(characterId: string, target: string): Promise<TurnResultWithInstructionsDto> {
    const response = await api.POST('/api/combat/{characterId}/attack', {
      params: { path: { characterId } },
      body: { target },
    });
    return getData<TurnResultWithInstructionsDto>(response);
  }

  /**
   * Get current combat status (includes actionToken for next action)
   */
  async getStatus(characterId: string): Promise<ExtendedCombatStateDto> {
    const response = await api.GET('/api/combat/{characterId}/status', { params: { path: { characterId } } });
    return getData<ExtendedCombatStateDto>(response);
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
  async resolveRollWithToken(characterId: string, actionToken: string, payload: DiceThrowDto & {
    action: string;
    target?: string;
  }) {
    // Use fetch directly for tokenized endpoint since openapi-fetch doesn't know about it yet
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const resp = await fetch(`${baseUrl}/api/combat/${characterId}/resolve-roll/${actionToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const error = await resp.json()
        .catch(() => ({ message: resp.statusText }));
      throw new Error(error.message || resp.statusText);
    }
    return resp.json() as Promise<TurnResultWithInstructionsDto>;
  }

  /**
   * Legacy resolve-roll without token (will be deprecated)
   * @deprecated Use resolveRollWithToken instead
   */
  async resolveRoll(characterId: string, payload: {
    action: string;
    target?: string;
    total?: number;
  }) {
    // Use fetch directly since generated types are stale and don't include body
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const resp = await fetch(`${baseUrl}/api/combat/${characterId}/resolve-roll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const error = await resp.json()
        .catch(() => ({ message: resp.statusText }));
      throw new Error(error.message || resp.statusText);
    }
    return resp.json() as Promise<TurnResultWithInstructionsDto>;
  }
}

export const combatService = new CombatService();
