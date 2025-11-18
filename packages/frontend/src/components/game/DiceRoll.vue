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
import { ref } from 'vue';
import { diceServiceApi } from '@/services/diceServiceApi';
import UiButton from '../ui/UiButton.vue';
import type { GameInstruction } from '@rpg/shared';
import { useEventBus } from '@rpg/shared';

const emit = defineEmits<{
  (e: 'rolled', payload: any): void;
  (e: 'send'): void;
}>();

const error = ref('');
const props = defineProps<{ pendingInstruction?: GameInstruction | null; expr: string }>();

const onClick = async () => {
  if (props.pendingInstruction?.roll) {
    await doRoll();
  } else {
    await send();
  }
};

const send = async () => {
  emit('send');
};

const doRoll = async () => {
  error.value = '';
  try {
  const res = await diceServiceApi.rollDice(props.expr);
    // Use modifier if it's a number (skill bonus), otherwise use 0
    let bonus = props.pendingInstruction?.roll?.modifier || 0;
    const diceValue = res.data.result;
    const total = diceValue + bonus;
    // Emit both the raw dice value and bonus so Gemini can detect nat 20/nat 1
    const bus = useEventBus();
    bus.emit('rolled', { diceValue, bonus, total });
  } catch (e: any) { error.value = e?.response?.data?.error || e.message; }
};
</script>
