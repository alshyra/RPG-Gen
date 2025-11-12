<template>
  <div>
    <button
      class="btn-primary"
      @click="onClick"
    >
      {{ props.pendingInstruction?.roll ? 'Roll 🎲' : 'Envoyer' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import axios from 'axios';
import { characterService } from '../../services/characterService';
import { type GameInstruction } from '../../services/gameEngine';

const emit = defineEmits<{
  (e: 'rolled', payload: any): void
  (e: 'send'): void
}>();

const error = ref('');
const props = defineProps<{ pendingInstruction?: GameInstruction | null, expr: string }>();

const currentCharacter = computed(() => characterService.getCurrentCharacter());
const onClick = async () => {
  if (props.pendingInstruction?.roll) {
    await doRoll();
  } else {
    await send();
  }
};

const send = async () => emit('send');

const doRoll = async () => {
  error.value = '';
  try {
    const res = await axios.post('/api/dice', { expr: props.expr });
    // Use modifierValue if provided, otherwise calculate from ability score
    let bonus = props.pendingInstruction?.roll?.modifierValue || 0;
    if (bonus === 0 && props.pendingInstruction?.roll?.modifier) {
      bonus = currentCharacter.value?.scores[props.pendingInstruction.roll.modifier] || 0;
    }
    const diceValue = res.data.result;
    const total = diceValue + bonus;
    // Emit both the raw dice value and bonus so Gemini can detect nat 20/nat 1
    emit('rolled', { diceValue, bonus, total });
  } catch (e: any) { error.value = e?.response?.data?.error || e.message; }
}
</script>