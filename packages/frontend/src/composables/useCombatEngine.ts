// packages/frontend/src/composables/useCombatEngine.ts
import { ref, shallowRef, onUnmounted, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useCombat as useBackendCombat } from '@/composables/useCombat';
import { CombatAdapter } from '@/adapters/combatAdapters';
import { useCombatStore } from '@/stores/combatStore';
import { useCharacterStore } from '@/stores/characterStore';
import type { CombatantDto, EnemyAttackLogDto } from '@rpg-gen/shared';
import type { UnitClickedPayload, CombatEngineEventPayload } from '@rpg-gen/combat-engine';

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
  const characterStore = useCharacterStore();
  const { enemies, player } = storeToRefs(combatStore);
  const { currentCharacter } = storeToRefs(characterStore);

  // Reference to the CombatArena component API (set via registerArena)
  const arenaApi = shallowRef<CombatArenaApi | null>(null);

  // State for the action modal
  const isActionModalOpen = ref(false);
  const selectedTarget = ref<CombatantDto | null>(null);

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

  /**
   * Subscribe to visual engine events
   */
  const subscribeToEvents = () => {
    if (!arenaApi.value) return;

    const handleUnitClicked = (payload: UnitClickedPayload) => {
      console.log('[useCombatEngine] unit:clicked', payload);

      // Only open menu for enemy units
      if (payload.isPlayer) {
        console.log('[useCombatEngine] Clicked player unit, ignoring');
        return;
      }

      // Find the enemy in store
      const enemy = enemies.value.find(e => e.id === payload.unitId);
      if (!enemy) {
        console.warn('[useCombatEngine] Enemy not found in store:', payload.unitId);
        return;
      }

      // Set target and open action menu overlay
      selectedTarget.value = enemy;
      isActionModalOpen.value = true;
    };

    arenaApi.value.on('unit:clicked', handleUnitClicked);
    registeredHandlers.push({
      event: 'unit:clicked',
      handler: handleUnitClicked as (...args: unknown[]) => void,
    });
  };

  /**
   * Execute an attack (weapon or spell)
   * Called from the modal when user chooses action
   */
  const executeAttack = async (target: CombatantDto, spellName?: string) => {
    if (!target?.id) {
      console.error('[useCombatEngine] Invalid target:', target);
      return;
    }

    if (!arenaApi.value) {
      console.warn('[useCombatEngine] No arena registered, skipping visual');
    }

    // Close modal
    isActionModalOpen.value = false;

    try {
      // Call backend
      await backendCombat.executeAttack(target, spellName);

      // Update visual with new HP from store
      if (!arenaApi.value) return;

      const updatedEnemy = enemies.value.find(e => e.id === target.id);
      if (!updatedEnemy || updatedEnemy.hp == undefined || target.hp == undefined) return;
      const damage = target.hp - updatedEnemy.hp;
      if (damage > 0) {
        arenaApi.value.updateUnitHealth(target.id, damage);
      }
    } catch (err) {
      console.error('[useCombatEngine] Attack failed:', err);
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
    if (!arenaApi.value || !player.value) return;

    for (const log of logs) {
      // Animate attack (TODO: add attack animation method)
      // For now just update health
      if (log.hit && log.damageTotal) {
        arenaApi.value.updateUnitHealth(log.targetId, log.damageTotal);
      }

      // Small delay between attacks for visibility
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  /**
   * Initialize visual arena with current combat state
   */
  const initializeVisual = async () => {
    if (!arenaApi.value || !combatStore.inCombat) return;

    const config = CombatAdapter.toCombatConfig({
      characterId: currentCharacter.value?.characterId ?? '',
      inCombat: combatStore.inCombat,
      enemies: enemies.value,
      player: player.value!,
      turnOrder: combatStore.turnOrder,
      currentTurnIndex: combatStore.currentTurnIndex,
      roundNumber: combatStore.roundNumber,
      phase: combatStore.phase,
      actionRemaining: combatStore.actionRemaining,
      actionMax: combatStore.actionMax,
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
      if (!log || !arenaApi.value || !player.value?.hp) return;

      // Enemy attacks player - update player HP (use damage from log)
      if (log.hit && log.damageTotal && arenaApi.value.updateUnitHealth && player.value) {
        arenaApi.value.updateUnitHealth(player.value.id, log.damageTotal);
        console.log(
          '[useCombatEngine] Updated player HP after enemy attack, damage:',
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

    // Modal state
    isActionModalOpen,
    selectedTarget,

    // Actions
    executeAttack,
    closeActionModal,
    handleAttackFromMenu,
    handleSpellFromMenu,
    replayEnemyAttacks,
    initializeVisual,
  };
}
