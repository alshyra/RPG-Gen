<template>
  <div class="w-full">
    <ul class="shadow-box bg-white border border-gray-200 rounded-md overflow-hidden">
      <li
        v-for="(item, i) in items"
        :key="item.id ?? i"
        class="relative border-b border-gray-200"
      >
        <button
          type="button"
          class="w-full px-6 py-6 text-left"
          :aria-expanded="openIndex === i"
          @click="toggle(i)"
        >
          <div class="flex items-center justify-between">
            <span class="text-slate-800">{{ item.title }}</span>
            <svg
              :class="{ 'transform rotate-180': openIndex === i }"
              class="w-5 h-5 text-gray-500 transition-transform duration-200"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        <div
          :ref="el => setRef(i, el)"
          class="relative overflow-hidden transition-all duration-700"
          :style="styleFor(i)"
        >
          <div class="px-6 pb-6">
            <slot
              :item="item"
              :index="i"
            >
              <div
                v-if="item.content"
                class="text-slate-700 text-sm"
                v-html="item.content"
              />
            </slot>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue';

interface AccordionItem {
  id?: string | number;
  title: string;
  content?: string;
}

const props = defineProps<{
  items: AccordionItem[];
  initialOpen?: number | null;
}>();

const emit = defineEmits<{
  (e: 'toggle', payload: { index: number; open: boolean }): void;
}>();

const items = props.items || [];
const openIndex = ref<number | null>(props.initialOpen ?? null);
const containerEls = ref<Record<number, HTMLElement | null>>({});
const heights = ref<Record<number, number>>({});

const setRef = (i: number, el: HTMLElement | null) => {
  containerEls.value[i] = el;
  if (el) heights.value[i] = el.scrollHeight;
};

const updateHeights = () => {
  Object.keys(containerEls.value).forEach((k) => {
    const idx = Number(k);
    const el = containerEls.value[idx];
    if (el) heights.value[idx] = el.scrollHeight;
  });
};

const toggle = async (i: number) => {
  openIndex.value = openIndex.value === i ? null : i;
  await nextTick();
  updateHeights();
  emit('toggle', { index: i, open: openIndex.value === i });
};

const styleFor = (i: number) => {
  const h = heights.value[i] ?? 0;
  return openIndex.value === i ? `max-height: ${h}px` : 'max-height: 0';
};

onMounted(() => {
  // ensure initial heights are measured
  nextTick().then(updateHeights);
});

// If items change, refresh heights
watch(
  () => items.length,
  async () => {
    await nextTick();
    updateHeights();
  },
);
</script>

<style scoped>
/* keep styles minimal; tailwind classes handle most layout */
</style>
