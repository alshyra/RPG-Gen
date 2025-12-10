import type { UnitData } from '../types/combat-types';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUnitsStore = defineStore('units', () => {
  const units = ref<Map<string, UnitData>>(new Map<string, UnitData>());
  const playerUnitIds = ref<Set<string>>(new Set<string>());

  const registerPlayerUnit = (unitId: string) => {
    playerUnitIds.value.add(unitId);
  };

  const isPlayerUnit = (unitId: string): boolean => {
    return playerUnitIds.value.has(unitId);
  };

  return {
    units,
    playerUnitIds,
    registerPlayerUnit,
    isPlayerUnit,
  };
});
