<template>
  <div class="card p-1 mb-2 max-h-44 overflow-y-auto">
    <div class="flex items-center justify-between mb-2">
      <div class="font-semibold">
        ⚔️ Combat
      </div>
      <div class="text-sm text-slate-400">
        Round {{ roundNumber }}
      </div>
    </div>

    <!-- Mobile: horizontal scroll (fixed tile size). Desktop: wrap tiles but keep fixed size and fixed gaps -->
    <div class="-mx-1 px-1">
      <div class="flex flex-nowrap sm:flex-wrap gap-1 overflow-x-auto sm:overflow-visible overflow-y-hidden">
        <div
          v-for="(p, idx) in localOrder"
          :key="p.id || idx"
          class="shrink-0 p-1"
          :style="{ width: '120px', height: '120px' }"
        >
          <FighterPortrait
            :enemy="p.isPlayer ? null : (p as unknown as any)"
            :is-player="p.isPlayer"
            @acted="onActorActed"
          />
        </div>
      </div>
    </div>

    <!-- per-card attack buttons replace the global attack; flee moved to chat controls -->
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useCombat } from '@/composables/useCombat';
import FighterPortrait from './FighterPortrait.vue';
import { useCharacterStore } from '@/stores/characterStore';
import { useCombatStore } from '@/stores/combatStore';
import type { CombatEnemyDto } from '@rpg-gen/shared';

type Participant = {
  id?: string;
  name?: string;
  initiative?: number;
  isPlayer?: boolean;
  hp?: number;
  hpMax?: number | string;
  portrait?: string;
};

const combat = useCombat();
const combatStore = useCombatStore();
const characterStore = useCharacterStore();

const enemies = combat.enemies;
const roundNumber = combat.roundNumber;

// Build participants array: player + enemies, ordered by initiative desc
const participants = computed(() => {
  const list: Participant[] = [];
  const player = characterStore.currentCharacter;
  if (player) {
    list.push({
      id: player.characterId,
      name: player.name,
      initiative: combatStore.playerInitiative ?? 0,
      isPlayer: true,
      hp: player.hp ?? 0,
      hpMax: player.hpMax ?? 0,
      portrait: player.portrait,
    });
  }

  const maybeRef = enemies as unknown as { value?: CombatEnemyDto[] };
  const enemyList: CombatEnemyDto[] = Array.isArray(maybeRef?.value) ? maybeRef.value! : Array.isArray(enemies) ? (enemies as unknown as CombatEnemyDto[]) : [];
  enemyList.forEach(e => list.push({ ...e, isPlayer: false }));

  // sort by initiative desc (higher initiative acts first)
  list.sort((a, b) => (b.initiative ?? 0) - (a.initiative ?? 0));
  return list;
});

// Local rotatable order to visually represent turn progression
const localOrder = ref<Participant[]>([]);

watch(participants, (next) => {
  localOrder.value = next.slice();
}, { immediate: true });

const onActorActed = (actor: string) => {
  // rotate only when the player acted
  if (actor !== 'player') return;
  if (localOrder.value.length === 0) return;
  const first = localOrder.value[0];
  if (first && first.isPlayer) {
    const shifted = localOrder.value.shift();
    if (shifted) localOrder.value.push(shifted);
  }
};
</script>
