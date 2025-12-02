import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const isMenuOpen = ref(false);
  const isCombatOpen = ref(true);

  const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value;
  };
  const setMenu = (v: boolean) => {
    isMenuOpen.value = v;
  };

  const toggleCombat = () => {
    isCombatOpen.value = !isCombatOpen.value;
  };

  const setCombatOpen = (v: boolean) => {
    isCombatOpen.value = v;
  };

  return {
    isMenuOpen,
    isCombatOpen,
    toggleMenu,
    setMenu,
    toggleCombat,
    setCombatOpen,
  };
});
