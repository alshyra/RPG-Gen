<template>
  <UiModal
    :is-open="isOpen"
    @close="close"
  >
    <!-- Header -->
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold text-amber-400 mb-2">
        ⚔️ {{ isPlayerAttack ? 'Votre Attaque' : 'Attaque Ennemie' }}
      </h2>
      <div class="text-sm text-slate-400">
        {{ attackerName }} → {{ targetName }}
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
              isCritical ? 'bg-green-600 text-white border-green-400' :
              isFumble ? 'bg-red-600 text-white border-red-400' :
              'bg-slate-600 text-amber-300 border-amber-400'
            ]"
          >
            {{ attackRoll }}
          </div>
          <span class="text-slate-400">+</span>
          <div class="text-lg text-slate-300">
            {{ attackBonus }}
          </div>
          <span class="text-slate-400">=</span>
          <div class="text-2xl font-bold text-amber-300">
            {{ totalAttack }}
          </div>
        </div>
        <div class="text-sm text-slate-500 mt-2">
          vs CA {{ targetAc }}
        </div>
      </div>

      <!-- Hit/Miss result -->
      <div class="text-center">
        <div
          v-if="isCritical"
          class="text-green-400 text-lg font-bold"
        >
          ✨ COUP CRITIQUE! ✨
        </div>
        <div
          v-else-if="isFumble"
          class="text-red-400 text-lg font-bold"
        >
          💀 ÉCHEC CRITIQUE! 💀
        </div>
        <div
          v-else-if="hit"
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
      v-if="hit && damageRoll.length > 0"
      class="bg-slate-700/50 rounded-lg p-4 mb-4"
    >
      <div class="text-center">
        <div class="text-sm text-slate-400 mb-2">
          Dégâts infligés
        </div>
        <div class="flex justify-center items-center gap-2 mb-2">
          <div
            v-for="(roll, idx) in damageRoll"
            :key="idx"
            class="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold bg-red-600/50 text-red-200 border border-red-500"
          >
            {{ roll }}
          </div>
          <span
            v-if="damageBonus !== 0"
            class="text-slate-400"
          >+</span>
          <div
            v-if="damageBonus !== 0"
            class="text-lg text-slate-300"
          >
            {{ damageBonus }}
          </div>
          <span class="text-slate-400">=</span>
          <div class="text-2xl font-bold text-red-400">
            {{ totalDamage }}
          </div>
        </div>
        <div
          v-if="isCritical"
          class="text-xs text-green-400"
        >
          (Dégâts doublés par le critique!)
        </div>
      </div>
    </div>

    <!-- HP Changes -->
    <div
      v-if="hit"
      class="bg-slate-700/50 rounded-lg p-4 mb-4"
    >
      <div class="flex justify-between items-center">
        <div class="text-sm text-slate-400">
          PV de {{ targetName }}
        </div>
        <div class="flex items-center gap-2">
          <span class="text-slate-300">{{ targetHpBefore }}</span>
          <span class="text-red-400">→</span>
          <span :class="targetHpAfter <= 0 ? 'text-red-500 font-bold' : 'text-slate-300'">
            {{ targetHpAfter }}
          </span>
        </div>
      </div>
      <div
        v-if="targetDefeated"
        class="text-center mt-3 text-amber-400 font-bold"
      >
        🏆 {{ targetName }} est vaincu!
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
import { computed } from 'vue';
import UiModal from '../ui/UiModal.vue';
import { useCombatStore } from '../../stores/combatStore';

const combatStore = useCombatStore();

// Computed properties from store
const isOpen = computed(() => combatStore.showAttackResultModal);
const isPlayerAttack = computed(() => combatStore.isCurrentAttackPlayerAttack);
const attackerName = computed(() => combatStore.currentAttackResult?.attacker ?? '');
const targetName = computed(() => combatStore.currentAttackResult?.target ?? '');
const attackRoll = computed(() => combatStore.currentAttackResult?.attackRoll ?? 0);
const attackBonus = computed(() => combatStore.currentAttackResult?.attackBonus ?? 0);
const totalAttack = computed(() => combatStore.currentAttackResult?.totalAttack ?? 0);
const targetAc = computed(() => combatStore.currentAttackResult?.targetAc ?? 0);
const hit = computed(() => combatStore.currentAttackResult?.hit ?? false);
const isCritical = computed(() => combatStore.currentAttackResult?.critical ?? false);
const isFumble = computed(() => combatStore.currentAttackResult?.fumble ?? false);
const damageRoll = computed(() => combatStore.currentAttackResult?.damageRoll ?? []);
const damageBonus = computed(() => combatStore.currentAttackResult?.damageBonus ?? 0);
const totalDamage = computed(() => combatStore.currentAttackResult?.totalDamage ?? 0);
const targetHpBefore = computed(() => combatStore.currentAttackResult?.targetHpBefore ?? 0);
const targetHpAfter = computed(() => combatStore.currentAttackResult?.targetHpAfter ?? 0);
const targetDefeated = computed(() => combatStore.currentAttackResult?.targetDefeated ?? false);

const close = () => combatStore.closeAttackResultModal();
</script>
