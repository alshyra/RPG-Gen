// packages/frontend/src/composables/useCombatEngine.ts
import { CombatAdapter } from "@/adapters/combatAdapters";
import { useCharacterId } from "@/composables/useCharacterId";
import { useCombat as useBackendCombat } from "@/composables/useCombat";
import { useCurrentCharacter } from "@/composables/useCurrentCharacter";
import { useCombatStore } from "@/stores/combatStore";
import { useCombat as useCombatApi } from "@rpg-gen/api-client";
import type { CombatEngineEventPayload, UnitClickedPayload } from "@rpg-gen/combat-engine";
import type { CombatantDto, EnemyAttackLogDto } from "@rpg-gen/shared";
import { storeToRefs } from "pinia";
import { onUnmounted, ref, shallowRef, watch } from "vue";

// Type for the exposed arena API from CombatArena.vue
export interface CombatArenaApi {
  init: (container?: HTMLDivElement) => Promise<void>;
  createUnit: (
    unitId: string,
    gridX: number,
    gridY: number,
    maxMoveRange: number,
    characterKey: string,
    hp: number,
    maxHp: number,
    isPlayer: boolean,
  ) => Promise<unknown>;
  clearAllUnits: () => Promise<void>;
  updateUnitHealth: (unitId: string, damage: number) => void;
  moveUnitToGrid: (unitId: string, gridX: number, gridY: number) => void;
  setupDragEvents: () => void;
  on: <T extends keyof CombatEngineEventPayload>(
    event: T,
    handler: (payload: CombatEngineEventPayload[T]) => void,
  ) => void;
  off: <T extends keyof CombatEngineEventPayload>(
    event: T,
    handler: (payload: CombatEngineEventPayload[T]) => void,
  ) => void;
  emit: <T extends keyof CombatEngineEventPayload>(
    event: T,
    payload: CombatEngineEventPayload[T],
  ) => void;
  getContainer: () => HTMLDivElement | null;
}

export function useCombatEngine() {
  const backendCombat = useBackendCombat();
  const combatStore = useCombatStore();
  const { currentAttackView } = storeToRefs(combatStore);
  const currentCharacter = useCurrentCharacter();
  const characterId = useCharacterId();
  const combat = useCombatApi(characterId);

  // Reference to the CombatArena component API (set via registerArena)
  const arenaApi = shallowRef<CombatArenaApi | null>(null);

  // State for the action modal
  const isActionModalOpen = ref(false);
  const selectedTarget = ref<CombatantDto | null>(null);

  // Freeze UI while replaying enemy attacks animations
  const isReplaying = ref(false);

  const registeredHandlers: {
    event: keyof CombatEngineEventPayload;
    handler: (...args: unknown[]) => void;
  }[] = [];

  /**
   * Register the CombatArena component's exposed API
   * Should be called from CombatPanel.vue after mounting
   */
  const registerArena = (api: CombatArenaApi) => {
    arenaApi.value = api;
    subscribeToEvents();
  };

  /**
   * Unregister arena and cleanup handlers
   */
  const unregisterArena = () => {
    if (arenaApi.value) {
      registeredHandlers.forEach(({ event, handler }) => {
        arenaApi.value?.off(event, handler);
      });
      registeredHandlers.length = 0;
    }
    arenaApi.value = null;
  };

  const endTurn = async () => {
    if (!currentCharacter || combat.endTurn.isPending.value) return;

    console.log("entering end turn, resolving ennemies attacks...");
    const response = await combat.endTurn.mutateAsync(characterId.value!);

    // Replay enemy attacks on visual engine (if arena is registered)
    if (response.attackLogs?.length) {
      await replayEnemyAttacks(response.attackLogs);
    }
  };
  /**
   * Subscribe to visual engine events
   */
  const subscribeToEvents = () => {
    if (!arenaApi.value) return;

    const handleUnitClicked = (payload: UnitClickedPayload) => {
      console.log("[useCombatEngine] unit:clicked", payload);

      // Only open menu for enemy units
      if (payload.isPlayer) {
        console.log("[useCombatEngine] Clicked player unit, ignoring");
        return;
      }

      // Find the enemy in store
      const enemy = (combat.status.data.value?.enemies ?? []).find(e => e.id === payload.unitId);
      if (!enemy) {
        console.warn("[useCombatEngine] Enemy not found in store:", payload.unitId);
        return;
      }

      // Set target and open action menu overlay
      selectedTarget.value = enemy;
      isActionModalOpen.value = true;
    };

    arenaApi.value.on("unit:clicked", handleUnitClicked);
    registeredHandlers.push({
      event: "unit:clicked",
      handler: handleUnitClicked as (...args: unknown[]) => void,
    });
  };

  // Watch for player's attack results coming from the combat store and trigger visual indicators
  // The store sets `currentAttackView` when an attack is processed (see useCombat.processAttackResult)
  watch(
    () => (typeof currentAttackView === "undefined" ? null : currentAttackView.value),
    attackView => {
      if (!attackView || !arenaApi.value || !attackView.targetId) return;
      // Emit engine event so the visual engine can display hit/miss/crit and damage
      try {
        arenaApi.value.emit("unit:attacked", {
          attackerId: attackView.attackerId ?? "player",
          targetId: attackView.targetId,
          damage: attackView.totalDamage ?? 0,
          isCrit: !!attackView.critical,
        });
      } catch (e) {
        console.warn("[useCombatEngine] Failed to emit unit:attacked", e);
      }
    },
  );

  /**
   * Execute an attack (weapon or spell)
   * Called from the modal when user chooses action
   */
  const executeAttack = async (target: CombatantDto, spellName?: string) => {
    if (!target?.id) {
      console.error("[useCombatEngine] Invalid target:", target);
      return;
    }

    if (!arenaApi.value) {
      console.warn("[useCombatEngine] No arena registered, skipping visual");
    }

    // Close modal
    isActionModalOpen.value = false;

    try {
      // Call backend
      await backendCombat.executeAttack(target, spellName);

      // Update visual with damage from attack result
      if (!arenaApi.value) return;

      const damage = currentAttackView.value?.totalDamage ?? 0;
      if (damage > 0) {
        arenaApi.value.updateUnitHealth(target.id, damage);
      }
    } catch (err) {
      console.error("[useCombatEngine] Attack failed:", err);
      // Error is already handled by useCombat.executeAttack
    }
  };

  /**
   * Close the action modal
   */
  const closeActionModal = () => {
    isActionModalOpen.value = false;
    selectedTarget.value = null;
  };

  /**
   * Replay enemy attack logs on the visual engine (after end-turn)
   */
  const replayEnemyAttacks = async (logs: EnemyAttackLogDto[]) => {
    isReplaying.value = true;
    try {
      console.log("replayEnemyAttacks", logs);
      if (!arenaApi.value || !combat.status.data.value?.player) return;

      for (const log of logs) {
        // Animate attack (TODO: add attack animation method)
        // For now just update health
        if (log.hit && log.damageTotal) {
          arenaApi.value.updateUnitHealth(log.targetId, log.damageTotal);
        }

        // Small delay between attacks for visibility
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } finally {
      isReplaying.value = false;
    }
  };

  /**
   * Initialize visual arena with current combat state
   */
  const initializeVisual = async () => {
    if (!arenaApi.value || !combat.isInCombat.value) return;

    // Clear old units before re-initializing
    await arenaApi.value.clearAllUnits();

    const config = CombatAdapter.toCombatConfig({
      characterId: currentCharacter?.value?.characterId ?? "",
      inCombat: combat.isInCombat.value,
      enemies: combat.status.data.value?.enemies ?? [],
      player: combat.status.data.value?.player!,
      turnOrder: combat.status.data.value?.turnOrder ?? [],
      currentTurnIndex: combat.status.data.value?.currentTurnIndex ?? 0,
      roundNumber: combat.status.data.value?.roundNumber ?? 1,
      actionRemaining: combat.status.data.value?.actionRemaining ?? 1,
      actionMax: combat.status.data.value?.actionMax ?? 1,
    });

    // Create units from config
    for (const unit of config.units) {
      await arenaApi.value.createUnit(
        unit.id,
        unit.position.gridX,
        unit.position.gridY,
        unit.stats.moveRange,
        unit.characterKey,
        unit.stats.hp,
        unit.stats.maxHp,
        !!unit.isPlayer,
      );
    }

    arenaApi.value.setupDragEvents();
  };

  // Watch for enemy attack logs and update visual HP
  watch(
    () => combatStore.currentEnemyAttackLog,
    log => {
      if (!log || !arenaApi.value || !combat.status.data.value?.player?.hp) return;

      // Enemy attacks player - update player HP (use damage from log)
      if (
        log.hit &&
        log.damageTotal &&
        arenaApi.value.updateUnitHealth &&
        combat.status.data.value?.player
      ) {
        arenaApi.value.updateUnitHealth(combat.status.data.value.player.id, log.damageTotal);
        console.log(
          "[useCombatEngine] Updated player HP after enemy attack, damage:",
          log.damageTotal,
        );
      }
    },
  );

  /**
   * Handle attack selection from overlay
   */
  const handleAttackFromMenu = async () => {
    if (!selectedTarget.value) return;
    closeActionModal();
    await executeAttack(selectedTarget.value);
  };

  /**
   * Handle spell selection from overlay
   */
  const handleSpellFromMenu = async () => {
    if (!selectedTarget.value) return;
    closeActionModal();
    // Open the spell selector modal for spell selection
    isActionModalOpen.value = true;
  };

  // Cleanup on unmount
  onUnmounted(() => {
    unregisterArena();
  });

  return {
    // Arena registration
    registerArena,
    unregisterArena,
    endTurn,

    // Modal state
    isActionModalOpen,
    selectedTarget,
    isReplaying,

    // Actions
    executeAttack,
    closeActionModal,
    handleAttackFromMenu,
    handleSpellFromMenu,
    replayEnemyAttacks,
    initializeVisual,
  };
}
