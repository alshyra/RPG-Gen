// packages/frontend/src/composables/useCombatEngine.ts
import { useCombat as useBackendCombat } from '@/composables/useCombat';
import { CombatAdapter } from '@/adapters/combatAdapter';

export function useCombatEngine() {
  const backendCombat = useBackendCombat();
  const visualCombat = useVisualCombat();

  // Initialiser le visuel quand le backend démarre
  watch(() => combatStore.inCombat, async (inCombat) => {
    if (inCombat && combatStore.player) {
      const config = CombatAdapter.toCombatConfig(combatStore.$state);
      await visualCombat.init(containerRef.value, config);
    }
  });

  // Intercepter les attaques pour animer
  const executeAttack = async (target: CombatantDto, spellName?: string) => {
    // 1. Animer visuellement
    await visualCombat.executeAttack(target.id);

    // 2. Appeler le backend
    await backendCombat.executeAttack(target, spellName);

    // 3. Synchroniser l'état visuel avec la réponse backend
    const updatedConfig = CombatAdapter.toCombatConfig(combatStore.$state);
    visualCombat.updateState(updatedConfig);
  };

  return {
    executeAttack,
    moveUnit: visualCombat.moveUnit,
    // ...
  };
}
