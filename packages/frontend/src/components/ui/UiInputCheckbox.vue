<template>
  <label
    role="checkbox"
    :aria-checked="effectiveChecked ? 'true' : 'false'"
    :aria-disabled="disabled ? 'true' : 'false'"
    data-testid="ui-checkbox"
    :class="[
      'inline-flex items-center gap-2 select-none',
      disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
    ]"
    @click.prevent="onClick"
  >
    <!-- hidden native checkbox for a11y & bindings -->
    <input
      ref="inputRef"
      type="checkbox"
      :checked="effectiveChecked"
      :disabled="disabled"
      class="sr-only"
      v-bind="$attrs"
      @change="emitChange"
    >

    <!-- visual box -->
    <span
      :class="[
        'flex items-center justify-center rounded-md border transition-all duration-150 ease-in-out',
        sizeClass,
        effectiveChecked ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-slate-700 border-slate-600 text-transparent',
        disabled ? 'opacity-60' : 'hover:ring-2 hover:ring-indigo-600/30'
      ]"
      :style="sizeStyle"
      aria-hidden="true"
    >
      <svg
        v-if="effectiveChecked"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        :class="['w-[calc(var(--icon-size))]', 'h-[calc(var(--icon-size))]']"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </span>

    <!-- label slot / fallback text -->
    <slot />
  </label>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  checked?: boolean;
  modelValue?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}>();

const emit = defineEmits<{
  (e: 'change', checked?: boolean): void;
  (e: 'update:modelValue', checked: boolean): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);

const effectiveChecked = computed(() => {
  if (typeof props.modelValue === 'boolean') return props.modelValue;
  return !!props.checked;
});

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-4 h-4 rounded-sm';
    case 'lg':
      return 'w-6 h-6 rounded-md';
    default:
      return 'w-5 h-5 rounded-sm';
  }
});

const sizeStyle = computed(() => {
  switch (props.size) {
    case 'sm':
      return { '--icon-size': '10px' } as Record<string, string>;
    case 'lg':
      return { '--icon-size': '14px' } as Record<string, string>;
    default:
      return { '--icon-size': '12px' } as Record<string, string>;
  }
});

function emitChange() {
  const val = !!inputRef.value?.checked;
  emit('update:modelValue', val);
  emit('change', val);
}

function onClick() {
  if (props.disabled) return;

  // compute the toggle value using effective state
  const newChecked = !effectiveChecked.value;

  // update the native input immediately for UI feedback
  if (inputRef.value) {
    inputRef.value.checked = newChecked;
    // also dispatch a native change event so any listeners on the input can react
    inputRef.value.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // emit v-model update and the higher-level change event for backwards compatibility
  emit('update:modelValue', newChecked);
  emit('change', newChecked);
}
</script>
