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
   * Execute a combat action - all actions are aptitudes now
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
   * Use an aptitude (all combat actions are aptitudes)
   */
  async useAptitude(
    characterId: string,
    aptitudeId: string,
    targetId?: string,
  ): Promise<CombatActionResponseDto> {
    return this.executeAction(characterId, {
      aptitudeId,
      ...(targetId && { targetId }),
    });
  },

  /**
   * Attack a target (uses basic attack aptitude)
   * @deprecated Use useAptitude with "com_frappe_basique" aptitudeId instead
   */
  async attack(
    characterId: string,
    target: CombatantDto,
  ): Promise<CombatActionResponseDto> {
    // Use the seeded basic attack aptitude
    return this.useAptitude(characterId, "com_frappe_basique", target.id);
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

/**
 * Vue Query wrapper for combat operations
 */
export function useCombat(
  characterId: MaybeRefOrGetter<string | undefined>,
  options?: { enabled?: boolean },
) {
  const queryClient = useQueryClient();

  const status = useQuery({
    queryKey: ["combat", toValue(characterId)],
    queryFn: async () => {
      const charId = toValue(characterId);
      if (!charId) throw new Error("Character ID is required");
      return combatApi.getStatus(charId);
    },
    enabled: computed(() => options?.enabled !== false && !!toValue(characterId)),
  });

  const startCombat = useMutation({
    mutationFn: async (data: { characterId: string; data: CombatStartRequestDto }) =>
      combatApi.startCombat(data.characterId, data.data),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["combat", variables.characterId] });
    },
  });

  const executeAction = useMutation({
    mutationFn: async (data: { characterId: string; action: CombatActionRequestDto }) =>
      combatApi.executeAction(data.characterId, data.action),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["combat", variables.characterId] });
    },
  });

  const attack = useMutation({
    mutationFn: async (data: { characterId: string; target: CombatantDto; spellName?: string }) => {
      if (!data.target) throw new Error(`Target not found`);
      return combatApi.attack(data.characterId, data.target, data.spellName);
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["combat", variables.characterId] });
    },
  });

  const useAptitude = useMutation({
    mutationFn: async (data: { characterId: string; aptitudeId: string; targetId?: string }) => {
      return combatApi.useAptitude(data.characterId, data.aptitudeId, data.targetId);
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["combat", variables.characterId] });
      // Also invalidate character to update PA/PM
      await queryClient.invalidateQueries({ queryKey: ["character", variables.characterId] });
    },
  });

  const endTurn = useMutation({
    mutationFn: async (characterId: string) => {
      return combatApi.endTurn(characterId);
    },
    onSuccess: async (_data, characterId) => {
      await queryClient.invalidateQueries({ queryKey: ["combat", characterId] });
    },
  });

  const endCombat = useMutation({
    mutationFn: async (characterId: string) => {
      return combatApi.flee(characterId);
    },
    onSuccess: async (_data, characterId) => {
      await queryClient.invalidateQueries({ queryKey: ["combat", characterId] });
    },
  });

  const move = useMutation({
    mutationFn: async (data: { characterId: string; movement: MovementRequestDto }) =>
      combatApi.move(data.characterId, data.movement),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["combat", variables.characterId] });
    },
  });

  const isInCombat = computed(() => status.data.value?.inCombat ?? false);
  const isLoading = computed(() => status.isLoading.value);

  return {
    status,
    startCombat,
    executeAction,
    attack,
    useAptitude,
    endTurn,
    endCombat,
    move,
    isInCombat,
    isLoading,
    // Filtered/computed properties only
    aliveEnemies: computed(() => (status.data.value?.enemies ?? []).filter(e => (e.hp ?? 0) > 0)),
    validTargets: computed(() =>
      (status.data.value?.enemies ?? []).filter(e => (e.hp ?? 0) > 0).map(e => e.name),
    ),
    hasValidTarget: computed(() => (status.data.value?.enemies ?? []).some(e => (e.hp ?? 0) > 0)),
    canAct: computed(() => status.data.value?.inCombat ?? false),
    canBonusAct: computed(() => false),
  };
}
