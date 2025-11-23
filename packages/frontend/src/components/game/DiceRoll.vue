<template>
  <div>
    <UiButton
      variant="primary"
      @click="onClick"
    >
      {{ props.pendingInstruction?.roll ? 'Roll 🎲' : 'Envoyer' }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/gameStore';
import UiButton from '../ui/UiButton.vue';
import { type GameInstruction } from '@rpg-gen/shared';

const emit = defineEmits<{
  (e: 'send'): void;
}>();

const props = defineProps<{ pendingInstruction?: GameInstruction | null; expr: string }>();

const gameStore = useGameStore();

const send = async () => emit('send');

const onClick = async () => {
  if (props.pendingInstruction?.roll) {
    await gameStore.doRoll(props.expr);
  } else {
    await send();
  }
};

// keep script minimal
</script>
