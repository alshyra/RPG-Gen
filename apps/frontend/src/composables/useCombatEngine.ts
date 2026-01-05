// packages/frontend/src/composables/useCombatEngine.ts
import { CombatAdapter } from "@/adapters/combatAdapters";
import { useCharacterId } from "@/composables/useCharacterId";
import { useCombat as useBackendCombat } from "@/composables/useCombat";
import { useCurrentCharacter } from "@/composables/useCurrentCharacter";
import { useCombatStore, type CombatArenaApi } from "@/stores/combatStore";
import { useCombat as useCombatApi } from "@rpg-gen/api-client";
import type { CombatEngineEventPayload, UnitClickedPayload } from "@rpg-gen/combat-engine";
import type { CombatantDto, EnemyAttackLogDto, GridPositionDto } from "@rpg-gen/shared";
import { storeToRefs } from "pinia";
import { onUnmounted, ref, watch } from "vue";

// Re-export the type from store for backwards compatibility
export type { CombatArenaApi } from "@/stores/combatStore";

/**
 * Build a full Manhattan path including start position.
 * Backend requires path[0] to be the current position.
 */
function buildManhattanPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): GridPositionDto[] {
  const path: GridPositionDto[] = [{ x: startX, y: startY }];

  let currentX = startX;
  let currentY = startY;

  // Move horizontally first (X axis)
  const stepX = endX > currentX ? 1 : -1;
  while (currentX !== endX) {
    currentX += stepX;
    path.push({ x: currentX, y: currentY });
  }

  // Then move vertically (Y axis)
  const stepY = endY > currentY ? 1 : -1;
  while (currentY !== endY) {
    currentY += stepY;
    path.push({ x: currentX, y: currentY });
  }

  return path;
}

export function useCombatEngine() {
  const backendCombat = useBackendCombat();
  const combatStore = useCombatStore();
  const { currentAttackView, currentEnemyAttackLog } = storeToRefs(combatStore);
  const currentCharacter = useCurrentCharacter();
  const characterId = useCharacterId();
  const combat = useCombatApi(characterId);

  // Use window as global storage to survive Vite module reloading
  // This ensures arenaApi is truly singleton even when module is loaded multiple times
  const getArenaApi = (): CombatArenaApi | null => {
    return (window as { __arenaApi?: CombatArenaApi | null }).__arenaApi ?? null;
  };
  const setArenaApi = (api: CombatArenaApi | null) => {
    (window as { __arenaApi?: CombatArenaApi | null }).__arenaApi = api;
  };

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
    setArenaApi(api);
    subscribeToEvents();
  };

  /**
   * Unregister arena and cleanup handlers
   * Note: We don't clear the arenaApi from window to allow late-binding
   * in case the component is remounted during navigation
   */
  const unregisterArena = () => {
    // Only cleanup event handlers, but don't clear the arenaApi
    // This allows executeAttack to still work during component transitions
    registeredHandlers.forEach(({ event, handler }) => {
      getArenaApi()?.off(event, handler);
    });
    registeredHandlers.length = 0;
    // Don't set arenaApi to null - keep it for late-bound calls
  };

  const endTurn = async () => {
    if (!currentCharacter || combat.endTurn.isPending.value) return;

    console.log("entering end turn, resolving ennemies attacks...");
    const response = await combat.endTurn.mutateAsync(characterId.value!);

    // Update player's PM after turn reset
    const arenaApi = getArenaApi();
    if (arenaApi && response.combatState?.player) {
      arenaApi.updateUnitMoveRange(
        response.combatState.player.id,
        response.combatState.player.pm ?? 0,
      );
    }

    // Replay enemy attacks on visual engine (if arena is registered)
    if (response.attackLogs?.length) {
      return await replayEnemyAttacks(response.attackLogs);
    }
    console.log("no enemy attacks to replay");
  };
  /**
   * Subscribe to visual engine events
   */
  const subscribeToEvents = () => {
    const arenaApi = getArenaApi();
    if (!arenaApi) return;
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

    arenaApi.on("unit:clicked", handleUnitClicked);
    registeredHandlers.push({
      event: "unit:clicked",
      handler: handleUnitClicked as (...args: unknown[]) => void,
    });

    // Handle unit movement with PM validation
    const handleUnitMoved = async (payload: {
      unitId: string;
      fromGridX: number;
      fromGridY: number;
      gridX: number;
      gridY: number;
      pmCost: number;
    }) => {
      console.log("[useCombatEngine] unit:moved", payload);

      // Only validate and sync player movements
      const playerUnit = combat.status.data.value?.player;
      if (!playerUnit || payload.unitId !== playerUnit.id) {
        console.log("[useCombatEngine] Enemy movement, no sync needed");
        return;
      }

      // Check if player has enough PM
      const currentPM = playerUnit.pm ?? 0;
      if (currentPM < payload.pmCost) {
        console.warn(`[useCombatEngine] Insufficient PM: ${currentPM} < ${payload.pmCost}`);
        // TODO: Show error message to user and revert movement
        return;
      }

      // Build full Manhattan path (start position + each step)
      // Backend requires path to start at current position
      const fullPath = buildManhattanPath(
        payload.fromGridX,
        payload.fromGridY,
        payload.gridX,
        payload.gridY,
      );

      // Sync movement with backend to consume PM
      try {
        const result = await combat.move.mutateAsync({
          characterId: characterId.value!,
          movement: {
            combatantId: payload.unitId,
            path: fullPath,
          },
        });

        console.log("[useCombatEngine] Movement synced, PM consumed:", result.pm);

        // Update visual move range to match new PM
        const arenaApi = getArenaApi();
        if (arenaApi) {
          arenaApi.updateUnitMoveRange(payload.unitId, result.pm ?? 0);
        }

        // Handle movement events (opportunity attacks, etc.)
        if (result.events && result.events.length > 0) {
          for (const event of result.events) {
            if (event.type === "opportunity-attack" && event.damage) {
              console.log("[useCombatEngine] Opportunity attack:", event);
              // Update visual HP
              if (arenaApi && event.targetId) {
                arenaApi.updateUnitHealth(event.targetId, event.damage);
              }
            }
          }
        }
      } catch (err) {
        console.error("[useCombatEngine] Failed to sync movement:", err);
        // TODO: Revert movement in visual
      }
    };

    arenaApi.on("unit:moved", handleUnitMoved);
    registeredHandlers.push({
      event: "unit:moved",
      handler: handleUnitMoved as (...args: unknown[]) => void,
    });
  };

  // Watch for player's attack results coming from the combat store and trigger visual indicators
  // The store sets `currentAttackView` when an attack is processed (see useCombat.processAttackResult)
  // Note: The actual emission happens via updateUnitHealth in executeAttack, not via this watcher
  // This watcher is kept as a fallback for cases where updateUnitHealth is not called directly
  watch(
    () => currentAttackView?.value ?? null,
    attackView => {
      const arenaApi = getArenaApi();
      if (!attackView || !arenaApi || !attackView.targetId) return;
      // Emit engine event so the visual engine can display hit/miss/crit and damage
      try {
        arenaApi.emit("unit:attacked", {
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

    console.log("[useCombatEngine] executeAttack called, arenaApi:", !!getArenaApi());

    if (!getArenaApi()) {
      console.warn("[useCombatEngine] No arena registered, skipping visual");
    }

    // Close modal
    isActionModalOpen.value = false;

    try {
      // Call backend - use basic attack if no spell specified
      const aptitudeId = spellName || "com_frappe_basique";
      await backendCombat.executeAptitude(target, aptitudeId);

      // Update visual with damage from attack result
      const arenaApi = getArenaApi();
      if (!arenaApi) return;

      const damage = currentAttackView.value?.totalDamage ?? 0;
      if (damage > 0) {
        arenaApi.updateUnitHealth(target.id, damage);
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
      if (!getArenaApi() || !combat.status.data.value?.player) return;

      for (const log of logs) {
        // Animate attack (TODO: add attack animation method)
        // For now just update health
        if (log.damageTotal && log.targetId) {
          const arenaApi = getArenaApi();
          if (arenaApi) {
            arenaApi.updateUnitHealth(log.targetId, log.damageTotal);
          }
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
    if (!getArenaApi()) return;

    // Force refetch to ensure we have fresh combat state
    await combat.status.refetch();

    if (!combat.isInCombat.value) return;

    // Clear old units before re-initializing
    const arenaApi = getArenaApi();
    if (!arenaApi) {
      console.error("[initializeVisual] Arena API not available");
      return;
    }

    await arenaApi.clearAllUnits();

    const config = CombatAdapter.toCombatConfig({
      characterId: currentCharacter?.value?.characterId ?? "",
      inCombat: combat.isInCombat.value,
      enemies: combat.status.data.value?.enemies ?? [],
      player: combat.status.data.value?.player ?? {
        id: "player-unknown",
        name: "Player",
        initiative: 0,
        isPlayer: true,
      },
      turnOrder: combat.status.data.value?.turnOrder ?? [],
      currentTurnIndex: combat.status.data.value?.currentTurnIndex ?? 0,
      roundNumber: combat.status.data.value?.roundNumber ?? 1,
    });

    // Create units from config
    for (const unit of config.units) {
      await arenaApi.createUnit(
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

    arenaApi.setupDragEvents();
  };

  // Watch for enemy attack logs and update visual HP
  watch(currentEnemyAttackLog, log => {
    console.log(
      "[useCombatEngine] Enemy attack watcher triggered, log:",
      log,
      "arenaApi:",
      !!getArenaApi(),
      "player:",
      combat.status.data.value?.player?.id,
    );
    const arenaApi = getArenaApi();
    if (!log || !arenaApi || !combat.status.data.value?.player?.hp) {
      console.log("[useCombatEngine] Enemy attack watcher skipped - missing requirement");
      return;
    }

    // Enemy attacks player - update player HP (use damage from log)
    if (log.hit && log.damageTotal && combat.status.data.value?.player) {
      console.log(
        "[useCombatEngine] Calling updateUnitHealth for player, damage:",
        log.damageTotal,
      );
      arenaApi.updateUnitHealth(combat.status.data.value.player.id, log.damageTotal);
      console.log(
        "[useCombatEngine] Updated player HP after enemy attack, damage:",
        log.damageTotal,
      );
    } else {
      console.log(
        "[useCombatEngine] Enemy attack did not meet conditions - hit:",
        log.hit,
        "damage:",
        log.damageTotal,
      );
    }
  });

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
