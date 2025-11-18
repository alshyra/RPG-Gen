<template>
  <UiModal
    :is-open="modelValue"
    @close="$emit('update:modelValue', false)"
  >
    <div class="space-y-4">
      <h2 class="text-2xl font-bold text-indigo-300">
        Générer un Avatar
      </h2>

      <p class="text-sm text-slate-400">
        Décrivez l'apparence physique de votre personnage. Plus de détails = meilleur résultat!
      </p>

      <div>
        <label class="block font-medium mb-2">Description physique</label>
        <textarea
          v-model="description"
          class="input w-full h-32 resize-none"
          placeholder="Ex: Cheveux longs roux, yeux verts, cicatrice sur la joue gauche, port altier..."
        />
      </div>

      <!-- Preview of current avatar if exists -->
      <div
        v-if="generatedAvatar"
        class="space-y-2"
      >
        <label class="block text-sm font-medium text-slate-300">Aperçu</label>
        <div class="rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
          <img
            :src="generatedAvatar"
            :alt="characterInfo"
            class="w-full h-64 object-cover"
          >
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-2 justify-end pt-4">
        <UiButton
          variant="ghost"
          @click="$emit('update:modelValue', false)"
        >
          Annuler
        </UiButton>
        <UiButton
          v-if="generatedAvatar"
          variant="primary"
          :disabled="isGenerating"
          @click="regenerate"
        >
          {{ isGenerating ? 'Génération...' : 'Régénérer' }}
        </UiButton>
        <UiButton
          v-if="generatedAvatar"
          variant="primary"
          @click="confirm"
        >
          Valider
        </UiButton>
        <UiButton
          v-if="!generatedAvatar"
          variant="primary"
          :disabled="!description.trim() || isGenerating"
          @click="generate"
        >
          {{ isGenerating ? 'Génération...' : 'Générer' }}
        </UiButton>
      </div>

      <!-- Error message -->
      <div
        v-if="error"
        class="p-3 rounded bg-red-900/30 border border-red-700 text-red-200 text-sm"
      >
        {{ error }}
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { imageServiceApi } from '@/services/imageServiceApi';
import { useCharacterCreation } from '@/composables/useCharacterCreation';
import UiModal from '../ui/UiModal.vue';
import UiButton from '../ui/UiButton.vue';

interface Props {
  modelValue: boolean;
  character?: {
    name?: string;
    gender?: string;
    race?: { name?: string };
    classes?: { name?: string }[];
  };
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  character: () => ({}),
});

defineEmits<Emits>();

const description = ref('');
const generatedAvatar = ref<string | null>(null);
const isGenerating = ref(false);
const error = ref<string | null>(null);

const characterInfo = computed(() => {
  const parts: string[] = [];
  if (props.character?.name) parts.push(props.character.name);
  if (props.character?.race?.name) parts.push(props.character.race.name);
  if (props.character?.classes?.[0]?.name) parts.push(props.character.classes[0].name);
  return parts.join(' - ') || 'Avatar';
});

const generate = async () => {
  if (!description.value.trim()) {
    error.value = 'Veuillez entrer une description';
    return;
  }

  isGenerating.value = true;
  error.value = null;

  try {
  const charId = (props.character as any)?.characterId || (props.character as any)?.id;
    if (!charId) throw new Error('Le personnage doit être sauvegardé avant de générer un avatar');
  generatedAvatar.value = await imageServiceApi.generateAvatar(charId);
  } catch (err: any) {
    error.value = err.response?.data?.error || err.message || 'Erreur lors de la génération de l\'avatar';
  } finally {
    isGenerating.value = false;
  }
};

const regenerate = () => {
  generatedAvatar.value = null;
  generate();
};

const confirm = () => {
  if (generatedAvatar.value) {
    // Update the shared character state instead of emitting an event
    const { currentCharacter } = useCharacterCreation();
    currentCharacter.value = { ...currentCharacter.value, portrait: generatedAvatar.value } as any;
    const emit = defineEmits<Emits>();
    emit('update:modelValue', false);
  }
};
</script>
