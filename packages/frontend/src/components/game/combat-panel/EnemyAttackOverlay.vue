<template>
  <transition name="attack-overlay">
    <div
      v-if="currentEnemyAttackLog"
      class="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
    >
      <!-- Enemy Attack -->
      <div
        v-if="isEnemyAttack && currentEnemyAttackLog"
        class="bg-slate-900/95 border border-red-600 rounded-lg p-6 shadow-2xl text-center max-w-md"
      >
        <div class="text-red-400 text-lg font-bold mb-2">
          ⚔️ {{ currentEnemyAttackLog.attackerName }} attaque!
        </div>
        <div
          v-if="currentEnemyAttackLog.hit"
          class="text-white"
        >
          <div class="text-2xl font-bold text-red-500 mb-1">
            {{ currentEnemyAttackLog.isCrit ? '💥 CRITIQUE!' : '✓ Touché!' }}
          </div>
          <div class="text-xl">
            -{{ currentEnemyAttackLog.damageTotal }} PV
          </div>
          <div
            v-if="currentEnemyAttackLog.attackRoll"
            class="text-sm text-slate-400 mt-2"
          >
            Jet d'attaque: {{ currentEnemyAttackLog.attackRoll.total }}
          </div>
        </div>
        <div
          v-else
          class="text-slate-300"
        >
          <div class="text-2xl font-bold text-green-400 mb-1">
            ✗ Raté!
          </div>
          <div
            v-if="currentEnemyAttackLog.attackRoll"
            class="text-sm text-slate-400 mt-2"
          >
            Jet d'attaque: {{ currentEnemyAttackLog.attackRoll.total }}
          </div>
        </div>
      </div>

      <!-- player overlay moved to PlayerAttackOverlay.vue -->
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useCombatStore } from '@/stores/combatStore';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const combatStore = useCombatStore();
const { currentEnemyAttackLog } = storeToRefs(combatStore);
const isEnemyAttack = computed(() => currentEnemyAttackLog.value !== null);
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
