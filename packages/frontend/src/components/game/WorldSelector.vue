<template>
  <div class="worlds">
    <label class="muted">Choisir un univers</label>
    <div class="space-y-3 mt-2">
      <div
        v-for="world in worlds"
        :key="world.id"
        class="tpl flex items-center justify-between p-3 rounded-md bg-slate-800/50 hover:bg-slate-800/70"
      >
        <div class="flex items-start gap-3">
          <div
            class="logo flex items-center justify-center w-12 h-12 rounded-md text-white font-bold shrink-0"
            :class="world.bgClass"
          >
            <!-- simple initials as logo -->
            {{ world.logo }}
          </div>
          <div class="text-left">
            <div class="text-sm font-semibold text-purple-300">
              {{ world.name }}
            </div>
            <div class="text-xs text-slate-400">
              {{ world.desc }}
            </div>
          </div>
        </div>

        <div>
          <UiButton
            :variant="world.enabled ? 'primary' : 'ghost'"
            :disabled="!world.enabled"
            class="flex items-center gap-2"
            :data-cy="`world-start-${world.id}`"
            @click="goToCharacterCreation(world.id)"
          >
            <span>Commencer</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import UiButton from '../ui/UiButton.vue';
import { useCharacterStore } from '@/stores/characterStore';
import { useRouter } from 'vue-router';
const router = useRouter();
const { createCharacter } = useCharacterStore();

const goToCharacterCreation = async (world: string) => {
  const character = await createCharacter(world);
  router.push({ path: `/character/${character.characterId}/step/1` });
};

const worlds = reactive([
  { id: 'dnd', enabled: true, logo: 'D', bgClass: 'bg-gradient-to-tr from-amber-500 to-rose-500', name: 'Dungeons & Dragons', desc: 'High fantasy, parties, and epic quests.' },
  { id: 'vtm', enabled: false, logo: 'V', bgClass: 'bg-gradient-to-tr from-violet-600 to-fuchsia-500', name: 'Vampire: The Masquerade', desc: 'Gothic-punk political roleplay among vampires.' },
  { id: 'cyberpunk', enabled: false, logo: 'C', bgClass: 'bg-gradient-to-tr from-cyan-400 to-indigo-500', name: 'Cyberpunk', desc: 'Near-future neon dystopia with tech & megacorps.' },
]);
</script>
