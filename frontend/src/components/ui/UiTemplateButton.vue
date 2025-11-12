<template>
  <button
    class="p-3 rounded-md bg-slate-800/50 border border-slate-700/40 text-left hover:bg-slate-800/70"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>
