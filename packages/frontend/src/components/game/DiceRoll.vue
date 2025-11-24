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
    // Get advantage/disadvantage from the game instruction
    const advantage = props.pendingInstruction.roll.advantage || 'none';
    await gameStore.doRoll(props.expr, advantage);
  } else {
    await send();
  }
};

// keep script minimal
</script>
