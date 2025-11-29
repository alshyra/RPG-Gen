<template>
  <div
    class="fighter-card relative bg-slate-800/40 rounded overflow-hidden flex items-stretch"
    :data-cy="props.isPlayer ? 'player-portrait' : ('enemy-portrait-' + (props.enemy?.id || props.enemy?.name))"
  >
    <div class="relative w-full h-full">
      <img
        :src="resolvedPortrait"
        class="absolute inset-0 w-full h-full object-cover"
        alt="portrait"
      >

      <div class="absolute top-1 left-1 bg-black/25 text-[10px] text-white px-1.5 py-0.5 rounded">
        <div class="font-medium">
          {{ title }}
        </div>
        <div class="text-[10px] text-slate-200">
          AC: {{ enemy?.ac ?? '-' }}
        </div>
        <div class="text-[10px] text-slate-200">
          Init: {{ enemy?.initiative ?? '-' }}
        </div>
      </div>

      <div class="absolute bottom-1 left-1 right-1 flex items-center justify-center">
        <div class="mx-2 pointer-events-auto">
          <button
            v-if="showAttackButton"
            class="px-2 py-0.5 text-[11px] rounded bg-amber-400 hover:bg-amber-300 text-amber-900"
            data-cy="attack-button"
            @click.prevent="doAttack"
          >
            Attaquer
          </button>
          <div
            v-else
            class="px-2 py-0.5 text-[11px] rounded bg-slate-600 text-slate-200"
          >
            {{ altLabel }}
          </div>
        </div>
      </div>

      <div class="absolute inset-y-2 right-1 flex items-center pointer-events-none">
        <div
          class="relative w-3 h-full bg-slate-700 rounded overflow-hidden"
          data-cy="hp-bar"
          :data-hp="String(enemyDisplayHp)"
        >
          <div
            class="absolute left-0 right-0 bottom-0 bg-linear-to-t from-red-600 to-red-400"
            :style="{ height: hpPct }"
          />
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-[9px] font-mono text-white transform -rotate-90 whitespace-nowrap">
              {{ enemyDisplayHp }} / {{ enemyDisplayMax }}
            </div>
          </div>
        </div>
      </div>

      <div class="absolute left-2 top-12 right-2 text-[10px] text-slate-100/90 px-2 line-clamp-2 hidden sm:block">
        {{ descriptionText }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useCombat } from '@/composables/useCombat';
import type { CombatEnemyDto } from '@rpg-gen/shared';
import { useCharacterStore } from '@/stores/characterStore';
import { pickBestPortrait, getFallbackPortrait } from '@/composables/usePortraits';

const props = defineProps<{
  enemy: CombatEnemyDto | null;
  isPlayer?: boolean;
}>();

const emit = defineEmits<{
  (e: 'acted', actor: string): void;
}>();

const characterStore = useCharacterStore();
const combat = useCombat();

const title = computed(() => (props.isPlayer ? (characterStore.currentCharacter?.name ?? 'You') : (props.enemy?.name ?? 'Enemy')));
const descriptionText = computed(() => props.enemy?.description ?? '');

const enemyDisplayHp = computed(() => props.isPlayer ? (characterStore.currentCharacter?.hp ?? 0) : (props.enemy?.hp ?? 0));
const enemyDisplayMax = computed(() => props.isPlayer ? (characterStore.currentCharacter?.hpMax ?? '-') : (props.enemy?.hpMax ?? '-'));
const hpPct = computed(() => {
  const hp = Number(enemyDisplayHp.value || 0);
  const max = typeof enemyDisplayMax.value === 'number' ? Number(enemyDisplayMax.value) : undefined;
  if (!max || max <= 0) return '0%';
  return ((Math.max(0, hp) / max) * 100) + '%';
});

const resolvedPortrait = ref<string>(`/images/enemies/enemy.png`);

onMounted(async () => {
  if (props.isPlayer) {
    resolvedPortrait.value = characterStore.currentCharacter?.portrait || `/images/enemies/hero.png`;
    return;
  }
  const enemy = props.enemy;
  if (!enemy) {
    resolvedPortrait.value = `/images/enemies/enemy.png`;
    return;
  }
  if (enemy.portrait) {
    resolvedPortrait.value = enemy.portrait;
    return;
  }
  const byManifest = await pickBestPortrait(enemy.name || enemy.id || 'enemy');
  resolvedPortrait.value = byManifest || getFallbackPortrait(enemy.name || enemy.id || 'enemy');
});

const showAttackButton = computed(() => !props.isPlayer && (props.enemy?.hp ?? 0) > 0);
const altLabel = computed(() => props.isPlayer ? 'Vous' : 'Mort');

const doAttack = async () => {
  if (!props.enemy) return;
  try {
    const target = props.enemy.name || props.enemy.id;
    await combat.executeAttack(target);
    emit('acted', 'player');
  } catch (e) {
    console.error('attack failed', e);
  }
};
</script>

<style scoped>
.fighter-card { width: 120px; height: 120px; }
.fighter-card img { object-position: center top; }
.fighter-card .font-medium { font-size: 0.78rem; }
.fighter-card .text-xs { font-size: 0.68rem; }
</style>
