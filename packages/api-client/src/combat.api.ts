import type {
  CombatStateDto,
  CombatStartRequestDto,
  CombatActionRequestDto,
  CombatActionResponseDto,
  CombatEndResponseDto,
  EndPlayerTurnResponseDto,
  MovementRequestDto,
  MovementResponseDto,
  CombatantDto,
} from "@rpg-gen/shared";
import { apiClient, getData } from "./index.js";

export const combatApi = {
  /**
   * Start a new combat session
   */
  async startCombat(characterId: string, request: CombatStartRequestDto): Promise<CombatStateDto> {
    const response = await apiClient.POST("/api/combat/{characterId}/start", {
      params: { path: { characterId } },
      body: request,
    });
    return getData(response);
  },

  /**
   * Execute a combat action (attack, spell, dash, etc.)
   */
  async executeAction(
    characterId: string,
    action: CombatActionRequestDto,
  ): Promise<CombatActionResponseDto> {
    const response = await apiClient.POST("/api/combat/{characterId}/action", {
      params: { path: { characterId } },
      body: action,
    });
    return getData(response);
  },

  /**
   * Attack a target (convenience wrapper)
   */
  async attack(
    characterId: string,
    target: CombatantDto,
    spellName?: string,
  ): Promise<CombatActionResponseDto> {
    const actionType = spellName ? "cast-spell" : "attack";
    return this.executeAction(characterId, {
      actionType,
      targetId: target.id,
      ...(spellName && { spellName }),
    });
  },

  /**
   * Get current combat status
   */
  async getStatus(characterId: string): Promise<CombatStateDto> {
    const response = await apiClient.GET("/api/combat/{characterId}/status", {
      params: { path: { characterId } },
    });
    return getData(response);
  },

  /**
   * End player turn and trigger enemy actions
   */
  async endTurn(characterId: string): Promise<EndPlayerTurnResponseDto> {
    const response = await apiClient.POST("/api/combat/{characterId}/end-turn", {
      params: { path: { characterId } },
    });
    return getData(response);
  },

  /**
   * Flee from combat
   */
  async flee(characterId: string): Promise<CombatEndResponseDto> {
    const response = await apiClient.POST("/api/combat/{characterId}/flee", {
      params: { path: { characterId } },
    });
    return getData(response);
  },

  /**
   * Move combatant on grid
   */
  async move(characterId: string, movement: MovementRequestDto): Promise<MovementResponseDto> {
    const response = await apiClient.POST("/api/combat/{characterId}/move", {
      params: { path: { characterId } },
      body: movement,
    });
    return getData(response);
  },
};
