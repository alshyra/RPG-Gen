import { ref } from 'vue';
import type { Ref } from 'vue';
import type { SpriteManifest, ActiveAnimationState, PopupState, AnimationDef } from '../types';

// ─────────────────────────────────────────────────────────────
// Default animation manifest (8 rows × 24 cols, frames 32×32)
// ─────────────────────────────────────────────────────────────
export const DEFAULT_ANIMATIONS: Record<string, AnimationDef> = {
  Idle: { row: 0, cols: [0, 1, 2, 3], loop: true },
  Walk: { row: 1, cols: [4, 5, 6, 7, 8, 9, 10, 11], loop: true },
  Sword: { row: 2, cols: [12, 13, 14, 15], loop: false },
  Bow: { row: 3, cols: [16, 17, 18, 19, 20, 21, 22, 23], loop: false },
  Stave: { row: 4, cols: [0, 1, 2, 3], loop: false },
  Throw: { row: 5, cols: [4, 5, 6, 7], loop: false },
  Hurt: { row: 6, cols: [8, 9, 10, 11], loop: false },
  Death: { row: 7, cols: [12, 13, 14, 15, 16, 17], loop: false },
};

export const DEFAULT_MANIFEST: SpriteManifest = {
  frameWidth: 32,
  frameHeight: 32,
  rows: 8,
  cols: 24,
  frameRate: 8,
  animations: DEFAULT_ANIMATIONS,
};

// ─────────────────────────────────────────────────────────────
// Store state (module-level singletons)
// ─────────────────────────────────────────────────────────────
const spritesMap: Ref<Map<string, HTMLImageElement>> = ref(new Map());
const spriteManifests: Ref<Map<string, SpriteManifest>> = ref(new Map());
const activeAnimations: Ref<Record<string, ActiveAnimationState>> = ref({});
const activePopups: Ref<Record<string, PopupState[]>> = ref({});

// ─────────────────────────────────────────────────────────────
// Sprite loading
// ─────────────────────────────────────────────────────────────
function loadSprite(url: string): Promise<HTMLImageElement> {
  const existing = spritesMap.value.get(url);
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      spritesMap.value.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      console.error(`[CombatGridStore] Failed to load sprite: ${url}`);
      reject(new Error(`Failed to load sprite: ${url}`));
    };
    img.src = url;
  });
}

// ─────────────────────────────────────────────────────────────
// Manifest helpers
// ─────────────────────────────────────────────────────────────
function getOrCreateManifest(
  url: string,
  overrides?: Partial<SpriteManifest>,
): SpriteManifest {
  const existing = spriteManifests.value.get(url);
  if (existing) return existing;

  const manifest: SpriteManifest = {
    ...DEFAULT_MANIFEST,
    ...overrides,
    animations: {
      ...DEFAULT_ANIMATIONS,
      ...(overrides?.animations ?? {}),
    },
  };
  spriteManifests.value.set(url, manifest);
  return manifest;
}

// ─────────────────────────────────────────────────────────────
// Animation control
// ─────────────────────────────────────────────────────────────
function addAnimation(
  unitId: string,
  animationName: string,
  manifest: SpriteManifest,
  opts?: { once?: boolean; frameRate?: number },
): void {
  const animDef = manifest.animations[animationName];
  if (!animDef) {
    console.warn(`[CombatGridStore] Animation "${animationName}" not found in manifest`);
    return;
  }

  const state: ActiveAnimationState = {
    animationName,
    row: animDef.row,
    cols: animDef.cols,
    frameIndex: 0,
    lastTs: performance.now(),
    frameRate: opts?.frameRate ?? manifest.frameRate,
    loop: animDef.loop,
    startedAt: performance.now(),
    once: opts?.once ?? !animDef.loop,
  };
  activeAnimations.value[unitId] = state;
}

function removeAnimation(unitId: string): void {
  delete activeAnimations.value[unitId];
}

function getAnimation(unitId: string): ActiveAnimationState | undefined {
  return activeAnimations.value[unitId];
}

// ─────────────────────────────────────────────────────────────
// Popup control
// ─────────────────────────────────────────────────────────────
let popupIdCounter = 0;

function createPopup(
  targetId: string,
  text: string,
  color: string,
  duration = 800,
  scale = 1,
): PopupState {
  const popup: PopupState = {
    id: `popup-${popupIdCounter++}`,
    text,
    color,
    createdAt: performance.now(),
    offsetY: 0,
    duration,
    scale,
  };

  if (!activePopups.value[targetId]) {
    activePopups.value[targetId] = [];
  }
  activePopups.value[targetId].push(popup);
  return popup;
}

function removePopup(targetId: string, popupId: string): void {
  const list = activePopups.value[targetId];
  if (!list) return;
  const idx = list.findIndex(p => p.id === popupId);
  if (idx !== -1) list.splice(idx, 1);
  if (list.length === 0) delete activePopups.value[targetId];
}

function getPopups(targetId: string): PopupState[] {
  return activePopups.value[targetId] ?? [];
}

// ─────────────────────────────────────────────────────────────
// Exported composable
// ─────────────────────────────────────────────────────────────
export function useCombatGridStore() {
  return {
    // State
    spritesMap,
    spriteManifests,
    activeAnimations,
    activePopups,

    // Sprite helpers
    loadSprite,
    getOrCreateManifest,

    // Animation helpers
    addAnimation,
    removeAnimation,
    getAnimation,

    // Popup helpers
    createPopup,
    removePopup,
    getPopups,

    // Constants
    DEFAULT_ANIMATIONS,
    DEFAULT_MANIFEST,
  };
}
