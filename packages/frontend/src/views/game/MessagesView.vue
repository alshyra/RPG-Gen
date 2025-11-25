<template>
  <main class="flex flex-col min-h-0 overflow-hidden">
    <div ref="messagesPane" class="flex-1 overflow-auto">
      <div class="space-y-3 p-2">
        <div
          v-for="(m, idx) in gameStore.messages"
          :key="idx"
          class="p-2 lg:p-3 rounded-md bg-slate-800/60 border border-slate-700/40"
        >
          <div class="text-xs text-slate-400 font-medium">
            {{ m.role }}
          </div>
          <UiMarkdown :text="m.text" />
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import UiMarkdown from '@/components/ui/UiMarkdown.vue';
import { useGameStore } from '@/stores/gameStore';

const gameStore = useGameStore();
const messagesPane = ref<any>(null);

// auto-scroll to bottom when messages change
watch(
  () => gameStore.messages,
  () => {
    if (messagesPane.value) {
      setTimeout(() => {
        messagesPane.value!.scrollTop = messagesPane.value!.scrollHeight;
      }, 50);
    }
  },
  { deep: true },
);

onMounted(() => {
  // nothing for now
});
</script>
