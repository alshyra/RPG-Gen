<template>
  <div>
    <div class="grid grid-cols-4 gap-2">
      <button
        v-for="allowedRace in allowedRaces"
        :key="allowedRace.id"
        :class="['p-2 rounded border', selected?.id===allowedRace.id ? 'border-indigo-500 bg-indigo-600/20' : 'border-slate-700']"
        @click.prevent="select(allowedRace)"
      >
        <div class="font-medium">
          {{ allowedRace.name }}
        </div>
        <div class="text-xs text-slate-400">
          {{ summaryMods(allowedRace.mods) }}
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
const props = defineProps<{ allowedRaces: Array<any> }>();
const emit = defineEmits<{
  (e: 'update:race', val: any): void;
}>();

const selected = ref<any>(null);

const select = (r: any) => {
  selected.value = r;
  emit('update:race', r);
};

const summaryMods = (mods: any) => {
  try {
    return Object.entries(mods).map(([k, v]) => `${k}${(v as number) >= 0 ? '+' + (v as number) : v}`).join(' ');
  } catch { return ''; }
};

watch(() => props.allowedRaces, (n) => {
  if (n && n.length === 1) select(n[0]);
}, {
  immediate: true,
});

const allowedRaces = computed(() => props.allowedRaces || []);
</script>

<style scoped>
</style>
