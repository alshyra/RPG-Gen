<template>
    <div class="relative w-full">
        <!-- Portrait -->
        <div
            class="relative rounded-lg overflow-hidden bg-slate-800 border border-slate-700 aspect-square h-64 mx-auto">
            <CharacterIllustration :clazz="character?.classes?.[0]?.name || ''" :raceId="character?.race?.id"
                :gender="character?.gender" :src="character?.portrait" />

            <div class="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-2">
                <div class="text-white font-bold text-sm truncate">{{ character?.name }}</div>
                <div class="text-amber-300 text-xs">
                    {{ character?.classes?.[0]?.name }} Lvl {{ character?.classes?.[0]?.level || 1 }}</div>
            </div>
            <div class="absolute top-0 left-100 right-0 p-2">
                <div class="text-red-400 font-bold text-sm mb-2">❤️ {{ hp }}</div>
            </div>

            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <!-- XP Bar -->
                <XpBar :percentage="xpPercent" :label="currentLevel" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import CharacterIllustration from './CharacterIllustration.vue';
import XpBar from '../ui/xp-bar.vue';
import { getCurrentLevel, getXpProgress } from '../utils/dndLevels';

interface Character {
    name?: string;
    portrait?: string;
    classes?: { name: string; level: number }[];
    race?: { id: string; name: string };
    gender?: 'male' | 'female';
    hp?: number;
    hpMax?: number;
    totalXp?: number;
}

const props = defineProps<{
    character?: Character | null;
}>();

const hp = computed(() => {
    if (!props.character) return '0/0';
    return `${props.character.hp || 0}/${props.character.hpMax || 12}`;
});

const currentLevel = computed(() => {
    const xp = props.character?.totalXp || 0;
    const level = getCurrentLevel(xp);
    return `Level ${level.level}`;
});

const xpPercent = computed(() => {
    const xp = props.character?.totalXp || 0;
    const progress = getXpProgress(xp);
    return progress.percentage;
});
</script>

<style scoped>
.aspect-square {
    aspect-ratio: 1 / 1;
}
</style>
