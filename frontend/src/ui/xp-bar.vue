<template>
    <div class="w-full">
        <!-- XP Progress Bar -->
        <div class="bg-slate-700 rounded-full h-2 overflow-hidden border border-slate-600">
            <div class="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all"
                :style="{ width: percentage + '%' }"></div>
        </div>
        <div class="text-xs text-purple-300 mt-1">{{ label }}</div>
    </div>
</template>

<script setup lang="ts">
interface Props {
    percentage: number;
    label: string;
}

defineProps<Props>();
</script>

<style scoped></style>
