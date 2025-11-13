<template>
  <div class="space-y-4">
    <h2 class="text-xl font-bold">
      Informations de base
    </h2>

    <div>
      <label class="block font-medium mb-2">Nom du personnage</label>
      <UiInputText
        :model-value="character.name"
        placeholder="Ex: Aragorn"
        @update:model-value="$emit('update:character', { ...character, name: $event })"
      />
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block font-medium mb-2">Genre</label>
        <div class="flex gap-2">
          <UiButtonToggle
            v-for="g in genders"
            :key="g"
            :is-selected="gender === g"
            @click="$emit('update:gender', g)"
          >
            {{ g === 'male' ? '♂️ Homme' : '♀️ Femme' }}
          </UiButtonToggle>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import UiInputText from '@/components/ui/UiInputText.vue';
import UiButtonToggle from '@/components/ui/UiButtonToggle.vue';

interface Props {
  character: any;
  gender: string;
  world?: string;
  genders: string[];
}

defineProps<Props>();
defineEmits<{
  (e: 'update:character', value: any): void;
  (e: 'update:gender', value: string): void;
}>();
</script>
