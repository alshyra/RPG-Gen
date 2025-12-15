<template>
  <RouterLink
    v-if="to"
    custom
    :to="to"
  >
    <template #default="{ href, navigate, isActive }">
      <UiButton
        :variant="variant"
        :is-loading="isLoading"
        :disabled="disabled"
        :href="href"
        :class="isActive ? 'bg-slate-700' : ''"
        v-bind="$attrs"
        @click="handleNavigate(navigate, $event)"
      >
        <slot />
      </UiButton>
    </template>
  </RouterLink>

  <UiButton
    v-else
    :variant="variant"
    :is-loading="isLoading"
    :disabled="disabled"
    v-bind="$attrs"
    @click="emit('click', $event)"
  >
    <slot />
  </UiButton>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type RouteLocationRaw, RouterLink } from 'vue-router';
import { UiButton } from '@rpg-gen/ui';

const props = defineProps<{
  variant?: 'primary' | 'ghost' | 'secondary';
  isLoading?: boolean;
  disabled?: boolean;
  to?: RouteLocationRaw;
}>();

const emit = defineEmits(['click']);

const isDisabled = computed(() => props.isLoading || props.disabled);

const handleNavigate = (navigate: ((e?: MouseEvent) => void) | undefined, e: MouseEvent) => {
  if (isDisabled.value) {
    e.preventDefault();
    return;
  }
  if (navigate) {
    navigate(e);
  }
};
</script>
