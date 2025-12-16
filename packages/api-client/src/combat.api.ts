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
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import type { MaybeRefOrGetter } from "vue";
import { computed, toValue } from "vue";
import { apiClient, getData } from "./index.js";

// Exported temporarily for legacy code - prefer using useCombat()
// Internal API functions (private - use useCombat() hook)
const combatApi = {
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

// Query keys factory
export const combatKeys = {
  all: ["combat"] as const,
  status: (characterId: string) => [...combatKeys.all, "status", characterId] as const,
};

/**
 * Vue Query wrapper for combat operations
 */
export function useCombat(
  characterId: MaybeRefOrGetter<string | undefined>,
  options?: { enabled?: boolean },
) {
  const queryClient = useQueryClient();
  const id = computed(() => toValue(characterId));

  const status = useQuery({
    queryKey: computed(() => {
      const charId = id.value;
      return charId ? combatKeys.status(charId) : ["combat"];
    }),
    queryFn: async () => {
      const charId = id.value;
      if (!charId) throw new Error("Character ID is required");
      return combatApi.getStatus(charId);
    },
    enabled: computed(() => {
      const charId = id.value;
      return options?.enabled !== false && !!charId;
    }),
  });

  const startCombat = useMutation({
    mutationFn: async (data: { characterId: string; data: CombatStartRequestDto }) => {
      return combatApi.startCombat(data.characterId, data.data);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: combatKeys.status(variables.characterId) });
    },
  });

  const executeAction = useMutation({
    mutationFn: async (data: { characterId: string; action: CombatActionRequestDto }) => {
      return combatApi.executeAction(data.characterId, data.action);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: combatKeys.status(variables.characterId) });
    },
  });

  const attack = useMutation({
    mutationFn: async (data: { characterId: string; targetName: string; spellName?: string }) => {
      // Find target from current status
      const currentStatus = status.data.value;
      const target = currentStatus?.enemies?.find(e => e.name === data.targetName);
      if (!target) throw new Error(`Target ${data.targetName} not found`);
      return combatApi.attack(data.characterId, target, data.spellName);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: combatKeys.status(variables.characterId) });
    },
  });

  const endTurn = useMutation({
    mutationFn: async (characterId: string) => {
      return combatApi.endTurn(characterId);
    },
    onSuccess: (_data, characterId) => {
      queryClient.invalidateQueries({ queryKey: combatKeys.status(characterId) });
    },
  });

  const endCombat = useMutation({
    mutationFn: async (characterId: string) => {
      return combatApi.flee(characterId);
    },
    onSuccess: (_data, characterId) => {
      queryClient.invalidateQueries({ queryKey: combatKeys.status(characterId) });
    },
  });

  const move = useMutation({
    mutationFn: async (data: { characterId: string; movement: MovementRequestDto }) => {
      return combatApi.move(data.characterId, data.movement);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: combatKeys.status(variables.characterId) });
    },
  });

  const isInCombat = computed(() => status.data.value?.inCombat ?? false);
  const isLoading = computed(() => status.isLoading.value);

  return {
    status,
    startCombat,
    executeAction,
    attack,
    endTurn,
    endCombat,
    move,
    isInCombat,
    isLoading,
  };
}
