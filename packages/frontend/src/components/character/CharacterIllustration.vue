<template>
  <div class="illustration rounded-md">
    <img
      :src="imgSrc"
      :alt="alt"
      class="object-contain max-w-full max-h-full"
      @error="onError"
    >
  </div>
</template>

<script setup lang="ts">
import {
  ref, computed, watch,
} from 'vue';
const props = defineProps<{
  clazz?: string;
  raceId?: string;
  gender?: string;
  src?: string;
}>();

const errored = ref(false);
const attemptIndex = ref(0);
const exts = [
  'png',
  'svg',
];

const normalize = (v: string | { id?: string;
  name?: string; } | null | undefined, fallback: string): string => {
  if (v == null) return fallback;
  if (typeof v === 'string') return v.toLowerCase();
  if (typeof v === 'object') {
    // prefer id, then name
    if (v.id) return String(v.id)
      .toLowerCase();
    if (v.name) return String(v.name)
      .toLowerCase()
      .replace(/\s+/g, '-');
    return fallback;
  }
  return String(v)
    .toLowerCase();
};

const buildName = () => {
  const c = normalize(props.clazz, 'fighter') || 'fighter';
  const r = normalize(props.raceId, 'human') || 'human';
  const g = normalize(props.gender, 'male') || 'male';
  return `${c}_${r}_${g}`;
};

// Use base URL so paths work whether app is served at root or subpath
const baseUrl: string = import.meta.env?.BASE_URL ?? '/';

const imgSrc = computed(() => {
  if (props.src) {
    if (errored.value) return `${baseUrl}images/placeholder-character.svg`;
    return props.src;
  }
  if (errored.value) return `${baseUrl}images/placeholder-character.svg`;
  const ext = exts[attemptIndex.value] || 'png';
  return `${baseUrl}images/${buildName()}.${ext}`;
});

function onError() {
  if (attemptIndex.value < exts.length - 1) {
    attemptIndex.value += 1;
  } else {
    errored.value = true;
  }
}

// If props change (new class/race/gender), reset attempts so we try fresh images
watch(() => [
  props.clazz,
  props.raceId,
  props.gender,
], () => {
  attemptIndex.value = 0;
  errored.value = false;
});

const alt = computed(() => `Illustration ${props.clazz || ''} ${props.raceId || ''} ${props.gender || ''}`);
</script>

<style scoped>
.illustration img {
    width: 100%;
    height: 100%;
    display: block
}
</style>
