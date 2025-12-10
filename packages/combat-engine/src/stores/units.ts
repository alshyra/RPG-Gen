import type { UnitData } from '@/types/combat-types';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUnitsStore = defineStore('units', () => {
  const units = ref<Map<string, UnitData>>(new Map<string, UnitData>());

  return {
    units,
  };
});
