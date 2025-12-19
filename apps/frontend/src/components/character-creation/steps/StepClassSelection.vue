<template>
  <div class="h-full flex flex-col">
    <h3 class="text-lg font-semibold mb-4 text-center">Choisissez votre classe</h3>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <UiLoader />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="flex-1 flex items-center justify-center text-red-400">
      <p>Erreur lors du chargement des classes</p>
    </div>

    <!-- Class cards -->
    <div v-else class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
      <button
        v-for="cls in classes"
        :key="cls.id"
        type="button"
        :class="[
          'relative p-4 lg:p-6 rounded-xl border-2 transition-all duration-200',
          'flex flex-col items-center text-center',
          'hover:scale-[1.02] hover:shadow-lg',
          selectedClass === cls.id
            ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/50'
            : 'border-slate-600 bg-slate-800/50 hover:border-slate-500',
        ]"
        @click="selectClass(cls.id)"
      >
        <!-- Class icon -->
        <div
          class="w-16 h-16 lg:w-20 lg:h-20 rounded-full flex items-center justify-center text-4xl lg:text-5xl mb-3"
          :style="{ backgroundColor: cls.color + '20' }"
        >
          {{ cls.icon }}
        </div>

        <!-- Class name -->
        <h4 class="text-lg lg:text-xl font-bold mb-2" :style="{ color: cls.color }">
          {{ cls.displayName }}
        </h4>

        <!-- Description -->
        <p class="text-sm text-slate-400 mb-4 flex-1">
          {{ cls.description }}
        </p>

        <!-- Base stats -->
        <div class="w-full grid grid-cols-3 gap-2 text-xs">
          <div class="bg-slate-700/50 rounded p-2">
            <div class="text-red-400 font-bold">❤️ {{ cls.baseStats.hp }}</div>
            <div class="text-slate-500">PV</div>
          </div>
          <div class="bg-slate-700/50 rounded p-2">
            <div class="text-yellow-400 font-bold">⚡ {{ cls.baseStats.pa }}</div>
            <div class="text-slate-500">PA</div>
          </div>
          <div class="bg-slate-700/50 rounded p-2">
            <div class="text-blue-400 font-bold">👟 {{ cls.baseStats.pm }}</div>
            <div class="text-slate-500">PM</div>
          </div>
        </div>

        <!-- Selected indicator -->
        <div
          v-if="selectedClass === cls.id"
          class="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"
        >
          <span class="text-white text-sm">✓</span>
        </div>
      </button>
    </div>

    <!-- Selection confirmation -->
    <div v-if="selectedClass && selectedClassData" class="mt-4 p-4 bg-slate-800/50 rounded-lg">
      <div class="flex items-center justify-between">
        <div>
          <span class="text-slate-400">Classe sélectionnée:</span>
          <span class="ml-2 font-bold" :style="{ color: selectedClassData.color }">
            {{ selectedClassData.icon }} {{ selectedClassData.displayName }}
          </span>
        </div>
        <div class="text-sm text-slate-500">
          L'inventaire de départ sera automatiquement attribué
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useAvailableClasses, useSelectClass, type ClassMetadata } from "@rpg-gen/api-client";
import { UiLoader } from "@rpg-gen/ui";
import { useCurrentCharacter } from "@/composables/useCurrentCharacter";
import { useCharacterId } from "@/composables/useCharacterId";

const currentCharacter = useCurrentCharacter();
const characterId = useCharacterId();

// API calls
const { data: classes, isLoading, error } = useAvailableClasses();
const selectClassMutation = useSelectClass(characterId);

// Local state
const selectedClass = ref<string | null>(null);

// Initialize from existing character data
watch(
  () => currentCharacter.value?.className,
  (className) => {
    if (className) {
      selectedClass.value = className;
    }
  },
  { immediate: true },
);

// Computed
const selectedClassData = computed<ClassMetadata | undefined>(() => {
  if (!selectedClass.value || !classes.value) return undefined;
  return classes.value.find((c) => c.id === selectedClass.value);
});

// Methods
async function selectClass(classId: string) {
  selectedClass.value = classId;
  
  // Call API to select class and assign starter pack
  try {
    await selectClassMutation.mutateAsync(classId);
  } catch (e) {
    console.error("Failed to select class:", e);
    // Reset selection on error
    selectedClass.value = currentCharacter.value?.className || null;
  }
}

// Expose selected class for parent validation
defineExpose({
  selectedClass,
  isValid: computed(() => !!selectedClass.value),
});
</script>
