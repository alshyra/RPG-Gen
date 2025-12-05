import { ref } from 'vue';

const manifest = ref<string[] | null>(null);

export const loadPortraitManifest = async (): Promise<string[] | null> => {
  if (manifest.value) return manifest.value;
  try {
    const resp = await fetch('/images/enemies/manifest.json');
    if (!resp.ok) {
      manifest.value = null;
      return null;
    }
    manifest.value = await resp.json();
    return manifest.value;
  } catch {
    manifest.value = null;
    return null;
  }
};

const slugify = (s: string) => {
  const base = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const i = base.lastIndexOf('-');
  return i === -1 ? base : base.slice(0, i);
};

export const pickBestPortrait = async (nameOrId?: string) => {
  const files = await loadPortraitManifest();
  const slug = slugify(String(nameOrId || 'enemy'));
  if (!files || files.length === 0) return null;
  const candidates = [
    `${slug}.webp`,
    `${slug}.png`,
  ];
  const found = candidates.find(c => files.includes(c));
  if (found) return `/images/enemies/${found}`;
  const match = files.find(f => f.includes(slug));
  return match ? `/images/enemies/${match}` : null;
};

export const getFallbackPortrait = (nameOrId?: string) => `/images/enemies/${slugify(String(nameOrId || 'enemy'))}.png`;
