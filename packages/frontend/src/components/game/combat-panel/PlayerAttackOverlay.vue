<template>
  <transition name="attack-overlay">
    <div
      v-if="currentPlayerAttackLog"
      class="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
    >
      <div class="bg-slate-900/95 border border-blue-500 rounded-lg p-6 shadow-2xl text-center max-w-md">
        <div class="text-blue-400 text-lg font-bold mb-2">
          ⚔️ Votre attaque!
        </div>
        <div
          v-if="playerAttackHit"
          class="text-white"
        >
          <div class="text-2xl font-bold text-green-400 mb-1">
            {{ currentPlayerAttackLog.isCrit ? '💥 CRITIQUE!' : '✓ Touché!' }}
          </div>
          <div class="text-xl">
            {{ currentPlayerAttackLog.damageTotal }} dégâts
          </div>
          <div
            v-if="currentPlayerAttackLog.diceResult"
            class="text-sm text-slate-400 mt-2"
          >
            Jet d'attaque: {{ currentPlayerAttackLog.diceResult.total }}
          </div>
        </div>
        <div
          v-else
          class="text-slate-300"
        >
          <div class="text-2xl font-bold text-red-400 mb-1">
            ✗ Raté!
          </div>
          <div
            v-if="currentPlayerAttackLog.diceResult"
            class="text-sm text-slate-400 mt-2"
          >
            Jet d'attaque: {{ currentPlayerAttackLog.diceResult.total }}
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useCombatStore } from '@/stores/combatStore';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const combatStore = useCombatStore();
const { currentPlayerAttackLog } = storeToRefs(combatStore);

// Player attack is a hit if damageTotal is defined and > 0
const playerAttackHit = computed(() => {
  const log = currentPlayerAttackLog.value;
  return log?.damageTotal !== undefined && log.damageTotal > 0;
});
</script>

<style scoped>
.attack-overlay-enter-active,
.attack-overlay-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.attack-overlay-enter-from,
.attack-overlay-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
