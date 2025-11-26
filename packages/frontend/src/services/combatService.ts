/**
 * Combat service for interacting with the backend combat API
 */
import type {
  CombatStartInstruction,
  TurnResult,
} from './combatTypes';
import apiClient from './axiosClient';

export interface CombatStartResponse {
  inCombat: boolean;
  roundNumber: number;
  playerInitiative: number;
  playerHp: number;
  playerHpMax: number;
  playerAc: number;
  enemies: {
    id: string;
    name: string;
    initiative: number;
    hp: number;
    hpMax: number;
  }[];
  turnOrder: {
    id: string;
    name: string;
    initiative: number;
    isPlayer: boolean;
  }[];
  narrative: string | null;
}

export interface AttackResponse extends TurnResult {
  instructions?: unknown[];
}

export interface CombatStatusResponse {
  inCombat: boolean;
  roundNumber?: number;
  playerHp?: number;
  playerHpMax?: number;
  enemies?: {
    id: string;
    name: string;
    hp: number;
    hpMax: number;
  }[];
  validTargets?: string[];
  narrative: string | null;
}

export interface CombatEndResponse {
  success: boolean;
  message: string;
  instructions?: unknown[];
}

class CombatService {
  /**
   * Start combat with the given enemies
   */
  async startCombat(
    characterId: string,
    combatStart: CombatStartInstruction,
  ): Promise<CombatStartResponse> {
    const response = await apiClient.post<CombatStartResponse>(
      `/combat/${characterId}/start`,
      combatStart,
    );
    return response.data;
  }

  /**
   * Execute an attack against a target
   */
  async attack(characterId: string, target: string): Promise<AttackResponse> {
    const response = await apiClient.post<AttackResponse>(
      `/combat/${characterId}/attack`,
      { target },
    );
    return response.data;
  }

  /**
   * Get current combat status
   */
  async getStatus(characterId: string): Promise<CombatStatusResponse> {
    const response = await apiClient.get<CombatStatusResponse>(
      `/combat/${characterId}/status`,
    );
    return response.data;
  }

  /**
   * End combat (flee)
   */
  async endCombat(characterId: string): Promise<CombatEndResponse> {
    const response = await apiClient.post<CombatEndResponse>(
      `/combat/${characterId}/end`,
    );
    return response.data;
  }
}

export const combatService = new CombatService();
