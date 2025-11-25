<template>
  <RouterLink
    v-if="to"
    custom
    :to="to"
  >
    <template #default="{ href, navigate, isActive }">
      <a
        :href="href"
        :class="['inline-flex items-center px-3 py-1 rounded-md font-semibold shadow-sm transition-opacity', buttonClass, isActive ? activeClass : '']"
        :aria-disabled="isDisabled"
        v-bind="$attrs"
        @click="handleNavigate(navigate, $event)"
      >
        <UiLoader
          v-if="isLoading"
          inline
          size="sm"
          class="-ml-1 mr-2"
        />
        <slot />
      </a>
    </template>
  </RouterLink>
  <button
    v-else
    :class="['inline-flex items-center px-3 py-1 rounded-md font-semibold shadow-sm transition-opacity', buttonClass]"
    :disabled="isDisabled"
    v-bind="$attrs"
    @click="onClick($event)"
  >
    <UiLoader
      v-if="isLoading"
      inline
      size="sm"
      class="-ml-1 mr-2"
    />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import UiLoader from './UiLoader.vue';

const props = defineProps<{
  variant?: 'primary' | 'ghost';
  isLoading?: boolean;
  disabled?: boolean;
  to?: any;
}>();

const emit = defineEmits(['click']);

const variantClass = computed(() => {
  if (props.variant === 'ghost') return 'bg-white/10 text-white';
  return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
});

const isDisabled = computed(() => props.isLoading || props.disabled);

const activeClass = 'bg-slate-700 text-white';

const buttonClass = computed(() => {
  const classes = [variantClass.value];
  if (isDisabled.value) {
    classes.push('opacity-50 cursor-not-allowed');
  } else {
    classes.push('cursor-pointer hover:opacity-90');
  }
  return classes.join(' ');
});

const handleNavigate = (navigate: (e?: any) => any, e: any) => {
  if (isDisabled.value) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    return;
  }
  if (navigate) {
    navigate(e);
  }
};

const onClick = (e: any) => {
  if (isDisabled.value) {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    return;
  }
  emit('click', e);
};
</script>
