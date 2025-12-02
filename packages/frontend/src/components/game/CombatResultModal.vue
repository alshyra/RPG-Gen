<template>
  <UiModal
    :is-open="showAttackResultModal"
    @close="close"
  >
    <!-- Header -->
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold text-amber-400 mb-2">
        ⚔️ {{ isCurrentAttackPlayerAttack ? 'Votre Attaque' : 'Attaque Ennemie' }}
      </h2>
      <div class="text-sm text-slate-400">
        {{ currentAttackResult?.attacker ?? '' }} → {{ currentAttackResult?.target ?? '' }}
      </div>
    </div>

    <!-- Attack Roll Display -->
    <div class="bg-slate-700/50 rounded-lg p-4 mb-4">
      <div class="text-center mb-4">
        <div class="text-sm text-slate-400 mb-2">
          Jet d'attaque
        </div>
        <div class="flex justify-center items-center gap-2">
          <div
            :class="[
              'w-14 h-14 rounded-lg flex items-center justify-center text-xl font-bold border-2',
              (currentAttackResult?.critical ?? false) ? 'bg-green-600 text-white border-green-400' :
              (currentAttackResult?.fumble ?? false) ? 'bg-red-600 text-white border-red-400' :
              'bg-slate-600 text-amber-300 border-amber-400'
            ]"
          >
            {{ currentAttackResult?.attackRoll ?? 0 }}
          </div>
          <span class="text-slate-400">+</span>
          <div class="text-lg text-slate-300">
            {{ currentAttackResult?.attackBonus ?? 0 }}
          </div>
          <span class="text-slate-400">=</span>
          <div class="text-2xl font-bold text-amber-300">
            {{ currentAttackResult?.totalAttack ?? 0 }}
          </div>
        </div>
        <div class="text-sm text-slate-500 mt-2">
          vs CA {{ currentAttackResult?.targetAc ?? 0 }}
        </div>
      </div>

      <!-- Hit/Miss result -->
      <div class="text-center">
        <div
          v-if="currentAttackResult?.critical ?? false"
          class="text-green-400 text-lg font-bold"
        >
          ✨ COUP CRITIQUE! ✨
        </div>
        <div
          v-else-if="currentAttackResult?.fumble ?? false"
          class="text-red-400 text-lg font-bold"
        >
          💀 ÉCHEC CRITIQUE! 💀
        </div>
        <div
          v-else-if="currentAttackResult?.hit ?? false"
          class="text-green-400 text-lg font-bold"
        >
          ✓ TOUCHÉ!
        </div>
        <div
          v-else
          class="text-red-400 text-lg font-bold"
        >
          ✗ RATÉ
        </div>
      </div>
    </div>

    <!-- Damage Display (only if hit) -->
    <div
      v-if="(currentAttackResult?.hit ?? false) && (currentAttackResult?.damageRoll ?? []).length > 0"
      class="bg-slate-700/50 rounded-lg p-4 mb-4"
    >
      <div class="text-center">
        <div class="text-sm text-slate-400 mb-2">
          Dégâts infligés
        </div>
        <div class="flex justify-center items-center gap-2 mb-2">
          <div
            v-for="(roll, idx) in (currentAttackResult?.damageRoll ?? [])"
            :key="idx"
            class="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold bg-red-600/50 text-red-200 border border-red-500"
          >
            {{ roll }}
          </div>
          <span
            v-if="(currentAttackResult?.damageBonus ?? 0) !== 0"
            class="text-slate-400"
          >+</span>
          <div
            v-if="(currentAttackResult?.damageBonus ?? 0) !== 0"
            class="text-lg text-slate-300"
          >
            {{ currentAttackResult?.damageBonus ?? 0 }}
          </div>
          <span class="text-slate-400">=</span>
          <div class="text-2xl font-bold text-red-400">
            {{ currentAttackResult?.totalDamage ?? 0 }}
          </div>
        </div>
        <div
          v-if="currentAttackResult?.critical ?? false"
          class="text-xs text-green-400"
        >
          (Dégâts doublés par le critique!)
        </div>
      </div>
    </div>

    <!-- HP Changes -->
    <div
      v-if="currentAttackResult?.hit ?? false"
      class="bg-slate-700/50 rounded-lg p-4 mb-4"
    >
      <div class="flex justify-between items-center">
        <div class="text-sm text-slate-400">
          PV de {{ currentAttackResult?.target ?? '' }}
        </div>
        <div class="flex items-center gap-2">
          <span class="text-slate-300">{{ currentAttackResult?.targetHpBefore ?? 0 }}</span>
          <span class="text-red-400">→</span>
          <span :class="(currentAttackResult?.targetHpAfter ?? 0) <= 0 ? 'text-red-500 font-bold' : 'text-slate-300'">
            {{ currentAttackResult?.targetHpAfter ?? 0 }}
          </span>
        </div>
      </div>
      <div
        v-if="currentAttackResult?.targetDefeated ?? false"
        class="text-center mt-3 text-amber-400 font-bold"
      >
        🏆 {{ currentAttackResult?.target ?? '' }} est vaincu!
      </div>
    </div>

    <!-- Continue Button -->
    <div class="flex justify-center">
      <button
        class="bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-6 rounded-lg transition"
        @click="close"
      >
        Continuer
      </button>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import UiModal from '../ui/UiModal.vue';
import { useCombatStore } from '../../stores/combatStore';
import { storeToRefs } from 'pinia';

const combatStore = useCombatStore();
const {
  showAttackResultModal,
  isCurrentAttackPlayerAttack,
  currentAttackResult,
} = storeToRefs(combatStore);

const close = () => combatStore.closeAttackResultModal();
</script>
