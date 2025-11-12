<template>
  <div class="worlds">
    <label class="muted">Choisir un univers</label>
    <div class="space-y-3 mt-2">
      <div
        v-for="w in worlds"
        :key="w.id"
        class="tpl flex items-center justify-between p-3 rounded-md bg-slate-800/50 hover:bg-slate-800/70"
      >
        <div class="flex items-center gap-3">
          <div
            class="logo flex items-center justify-center w-12 h-12 rounded-md text-white font-bold"
            :class="w.bgClass"
          >
            <!-- simple initials as logo -->
            {{ w.logo }}
          </div>
          <div>
            <div class="text-sm font-semibold text-purple-300">
              {{ w.name }}
            </div>
            <div class="text-xs text-slate-400">
              {{ w.desc }}
            </div>
          </div>
        </div>

        <div>
          <UiButton
            variant="ghost"
            class="flex items-center gap-2"
            @click="$emit('select', w.id)"
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

const emit = defineEmits<{
  (e: 'select', id: string): void
}>();

const worlds = reactive([
  { id: 'dnd', logo: 'D', bgClass: 'bg-gradient-to-tr from-amber-500 to-rose-500', name: "Dungeons & Dragons", desc: 'High fantasy, parties, and epic quests.' },
  { id: 'vtm', logo: 'V', bgClass: 'bg-gradient-to-tr from-violet-600 to-fuchsia-500', name: 'Vampire: The Masquerade', desc: 'Gothic-punk political roleplay among vampires.' },
  { id: 'cyberpunk', logo: 'C', bgClass: 'bg-gradient-to-tr from-cyan-400 to-indigo-500', name: 'Cyberpunk', desc: 'Near-future neon dystopia with tech & megacorps.' }
]);
</script>
