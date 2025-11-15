<!-- Example Inertia Vue Page -->
<!-- Location in AdonisJS project: resources/js/pages/home.vue -->

<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3'
import { ref } from 'vue'

// Import reusable components from current architecture
import UiButton from '../components/ui/UiButton.vue'
import CharacterCard from '../components/character-stats/CharacterCard.vue'

// Props passed from server (HomeController)
const props = defineProps<{
  user: {
    id: number
    email: string
    displayName: string
    picture?: string
  }
  characters: Array<{
    id: string
    name: string
    race: { name: string }
    classes: Array<{ name: string; level: number }>
    hp: number
    hpMax: number
  }>
}>()

// Local state (no Pinia needed for simple state)
const showCreateModal = ref(false)

function handleCreateCharacter() {
  showCreateModal.value = true
}
</script>

<template>
  <Head title="Home" />

  <div class="min-h-screen bg-slate-900 text-white">
    <!-- Header -->
    <header class="border-b border-slate-700 p-4">
      <div class="container mx-auto flex justify-between items-center">
        <h1 class="text-2xl font-bold">RPG-Gen</h1>
        
        <div class="flex items-center gap-4">
          <span>{{ user.displayName }}</span>
          <img 
            v-if="user.picture" 
            :src="user.picture" 
            alt="Profile"
            class="w-8 h-8 rounded-full"
          />
          <Link href="/auth/logout" method="post" as="button">
            <UiButton variant="ghost">Logout</UiButton>
          </Link>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto p-6">
      <div class="mb-6 flex justify-between items-center">
        <h2 class="text-3xl font-bold">My Characters</h2>
        
        <!-- Using Inertia Link instead of Vue Router -->
        <Link href="/character/dnd/step/1">
          <UiButton variant="primary" @click="handleCreateCharacter">
            Create New Character
          </UiButton>
        </Link>
      </div>

      <!-- Characters Grid -->
      <div v-if="characters.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="character in characters" :key="character.id">
          <!-- Reusing existing component -->
          <CharacterCard :character="character">
            <template #actions>
              <Link :href="`/game/${character.id}`">
                <UiButton variant="primary">Play</UiButton>
              </Link>
            </template>
          </CharacterCard>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <p class="text-xl text-slate-400 mb-4">No characters yet</p>
        <Link href="/character/dnd/step/1">
          <UiButton variant="primary">Create Your First Character</UiButton>
        </Link>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Tailwind classes used - no custom CSS needed */
</style>
