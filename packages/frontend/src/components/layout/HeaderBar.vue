<template>
  <header class="flex flex-col lg:flex-row lg:items-center lg:justify-between p-2 gap-2 min-h-14">
    <!-- Title - left aligned (no subtitle by default) -->
    <div class="flex-none text-left order-first lg:order-0">
      <router-link
        :to="{ name: 'home' }"
        class="inline-block"
      >
        <h1 class="text-xl lg:text-2xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-purple-400 to-pink-500">
          RPG Gemini
        </h1>
      </router-link>
    </div>
  </header>
</template>

<style scoped></style>
