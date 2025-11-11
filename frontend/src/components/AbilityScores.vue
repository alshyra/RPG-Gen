<template>
    <div>
        <div class="font-bold text-sm text-slate-300">Caractéristiques</div>
        <div class="mt-2 grid grid-cols-3 gap-1 text-xs">
            <div v-for="(ability, key) in abilities" :key="key" class="text-center">
                <div class="text-slate-400">{{ ability.short }}</div>
                <div :class="['font-bold', ability.color]">{{ getAbilityScore(key) }}</div>
                <div class="text-xs text-slate-500 mt-0.5">{{ getModifier(getAbilityScore(key)) > 0 ? '+' : '' }}{{
                    getModifier(getAbilityScore(key)) }}</div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { characterService } from '../services/characterService';


const abilities = {
    str: { short: 'STR', color: 'text-amber-400' },
    dex: { short: 'DEX', color: 'text-amber-400' },
    con: { short: 'CON', color: 'text-amber-400' },
    int: { short: 'INT', color: 'text-blue-400' },
    wis: { short: 'WIS', color: 'text-green-400' },
    cha: { short: 'CHA', color: 'text-pink-400' },
};

const character = computed(() => characterService.getCurrentCharacter());

// Get ability score from character (tries multiple formats)
function getAbilityScore(key: string): number {
    if (!character.value) return 10;

    // Try capitalized format (Str, Dex, etc.)
    const capitalized = key.charAt(0).toUpperCase() + key.slice(1);

    return character.value.scores[capitalized];
}

// Calculate D&D modifier from ability score
function getModifier(score: number): number {
    return Math.floor((score - 10) / 2);
}
</script>

<style scoped></style>
