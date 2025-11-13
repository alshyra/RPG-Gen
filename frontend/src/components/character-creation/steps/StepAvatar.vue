<script setup lang="ts">
import UiInputTextarea from '@/components/ui/UiInputTextarea.vue';

interface Character {
  name: string;
  race: any;
  scores: Record<string, number>;
  [key: string]: any;
}

interface Props {
  character: Character;
  gender: string;
  primaryClass: string;
  generatedAvatar: string | null;
  isGenerating: boolean;
  avatarDescription: string;
}

interface Emits {
  (e: 'update:avatar-description', value: string): void;
  (e: 'generate'): void;
  (e: 'regenerate'): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const handleGenerate = () => {
  emit('generate');
};

const handleRegenerate = () => {
  emit('regenerate');
};
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">
      Générer un Avatar
    </h2>
    <p class="text-slate-400 text-sm">
      (Optionnel) Décrivez l'apparence physique de votre personnage pour générer un avatar avec l'IA
    </p>

    <div class="mt-4">
      <label class="block font-medium mb-2">Description physique</label>
      <UiInputTextarea
        :model-value="avatarDescription"
        placeholder="Ex: Grand et musclé, cheveux noirs long, cicatrice sur la joue gauche..."
        :rows="4"
        @update:model-value="$emit('update:avatar-description', $event)"
      />
    </div>

    <div
      v-if="generatedAvatar"
      class="mt-4"
    >
      <img
        :src="generatedAvatar"
        alt="Generated Avatar"
        class="w-48 h-48 rounded border border-slate-600 object-cover"
      >
    </div>

    <!-- Generation buttons -->
    <div class="flex gap-2 mt-4">
      <button
        v-if="!generatedAvatar"
        :disabled="!avatarDescription.trim() || isGenerating"
        class="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        @click="handleGenerate"
      >
        {{ isGenerating ? 'Génération...' : '🎨 Générer' }}
      </button>
      <button
        v-if="generatedAvatar"
        class="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 transition"
        @click="handleRegenerate"
      >
        Régénérer
      </button>
    </div>
  </div>
</template>
