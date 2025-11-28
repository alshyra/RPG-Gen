<template>
  <div class="card p-3 mb-2">
    <div class="flex items-center justify-between mb-2">
      <div class="font-semibold">
        ⚔️ Combat
      </div>
      <div class="text-sm text-slate-400">
        Round {{ roundNumber }}
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      <div
        v-for="(enemy, idx) in enemies"
        :key="enemy.id || idx"
        class="enemy-card relative bg-slate-800/40 rounded overflow-hidden flex items-stretch aspect-square"
      >
        <div class="relative w-full h-full">
          <!-- full-bleed portrait -->
          <img :src="getEnemyPortrait(enemy)" class="absolute inset-0 w-full h-full object-cover" alt="portrait" />
          <!-- subtle dark overlay for readability (reduced opacity) -->
          <!-- <div class="absolute inset-0 bg-black/10"></div> -->

          <!-- top-left: name + AC + Initiative -->
          <div class="absolute top-2 left-2 bg-black/25 text-xs text-white px-2 py-1 rounded">
            <div class="font-medium">{{ enemy.name }}</div>
            <div class="text-xs text-slate-200">AC: {{ enemy.ac }}</div>
            <div class="text-xs text-slate-200">Init: {{ enemy.initiative ?? '-' }}</div>
          </div>

          <!-- bottom: centered attack button -->
          <div class="absolute bottom-2 left-2 right-2 flex items-center justify-center">
            <div class="mx-4 pointer-events-auto">
              <button
                v-if="enemy.hp > 0"
                class="px-3 py-1 text-sm rounded bg-amber-400 hover:bg-amber-300 text-amber-900"
                @click.prevent="attackEnemy(enemy)"
              >
                Attaquer
              </button>
            </div>
          </div>

          <!-- vertical HP bar on the right side of the tile -->
          <div class="absolute inset-y-4 right-2 flex items-center pointer-events-none">
            <div class="relative w-5 h-full bg-slate-700 rounded overflow-hidden">
              <div
                class="absolute left-0 right-0 bottom-0 bg-linear-to-t from-red-600 to-red-400"
                :style="{ height: (enemy.hp && enemy.hpMax) ? ((Math.max(0, enemy.hp) / enemy.hpMax) * 100) + '%' : '0%' }"
              />
              <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-xs font-mono text-white transform -rotate-90 whitespace-nowrap">
                  {{ enemy.hp }} / {{ enemy.hpMax ?? '-' }}
                </div>
              </div>
            </div>
          </div>

          <!-- optional description overlay (small) -->
          <div class="absolute left-2 top-16 right-2 text-xs text-slate-100/90 px-2">
            {{ (enemy as any).description ?? '' }}
          </div>
        </div>
      </div>
    </div>

    <!-- per-card attack buttons replace the global attack; flee moved to chat controls -->
  </div>
</template>

<script setup lang="ts">
import { useCombat } from '@/composables/useCombat';

const combat = useCombat();

const enemies = combat.enemies;
const roundNumber = combat.roundNumber;

const attackEnemy = async (enemy: any) => {
  const target = enemy?.name || enemy?.id;
  if (!target) return;
  try {
    await combat.executeAttack(target);
  } catch (e) {
    console.error('Failed to attack', e);
  }
};

import { onMounted, ref, watch } from 'vue';

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const manifest = ref<string[] | null>(null);
const portraitMap = ref<Record<string, string>>({});

const loadManifest = async () => {
  if (manifest.value) return manifest.value;
  try {
    const resp = await fetch('/images/enemies/manifest.json');
    if (!resp.ok) throw new Error('no manifest');
    manifest.value = await resp.json();
    return manifest.value;
  } catch (err) {
    // manifest not available — fallback to no manifest
    manifest.value = null;
    return null;
  }
};

const pickBestFromManifest = (slug: string) => {
  const files = manifest.value || [];
  if (!files.length) return null;

  // prefer exact matches (webp then png), then -1 variants, then fuzzy best substring match
  const candidates = [
    `${slug}.webp`,
    `${slug}.png`,
    `${slug}-1.webp`,
    `${slug}-1.png`,
  ];

  for (const c of candidates) {
    if (files.includes(c)) return `/images/enemies/${c}`;
  }

  // fuzzy: pick filename with longest common substring to slug
  let best: string | null = null;
  let bestScore = 0;
  for (const f of files) {
    const name = f.replace(/\.[^/.]+$/, '');
    // simple common substring score
    let score = 0;
    for (let i = 0; i < name.length; i++) {
      for (let j = i + 1; j <= name.length; j++) {
        const sub = name.slice(i, j);
        if (sub.length <= bestScore) continue;
        if (slug.includes(sub)) score = Math.max(score, sub.length);
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = f;
    }
  }
  return best ? `/images/enemies/${best}` : null;
};

const ensurePortraits = async () => {
  await loadManifest();
  (enemies as any).forEach((enemy: any) => {
    const key = enemy.id || slugify(enemy.name || 'enemy');
    // prefer explicit portrait
    if (enemy && enemy.portrait) {
      portraitMap.value[key] = enemy.portrait;
      return;
    }

    // try to pick from manifest
    const slug = slugify(String(enemy?.name || enemy?.id || 'enemy'));
    const picked = pickBestFromManifest(slug);
    if (picked) {
      portraitMap.value[key] = picked;
      return;
    }

    // default fallback (existing generic file if present)
    portraitMap.value[key] = `/images/enemies/${slug}.png`;
  });
};

onMounted(() => {
  ensurePortraits();
});

watch(enemies, () => {
  ensurePortraits();
}, { deep: true });

const getEnemyPortrait = (enemy: any) => {
  const key = enemy.id || slugify(enemy?.name || 'enemy');
  return portraitMap.value[key] || (enemy && enemy.portrait) || `/images/enemies/${slugify(String(enemy?.name || enemy?.id || 'enemy'))}.png`;
};
</script>
