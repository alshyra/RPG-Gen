import { ref, onUnmounted } from 'vue';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { GRID_CONFIG, type availableCharacterKeys } from '../types/combat-types';
import { animations as animationConfig } from '../services/spritesAnimations';

// New modules
import { loadTextures, preloadFont, preloadHeartIcon } from '../services/assets/assetManager';
import {
  createGrid,
  createRangeOverlay,
  showReachableCells,
  hideReachableCells,
  gridToPixel,
  pixelToGrid,
} from '../services/render/gridRenderer';
import { useCombatUnit } from './useCombatUnit';
import { setupInteractionController } from '../services/input/interactionController';
import { useUnitsStore } from '../stores/units';
import { storeToRefs } from 'pinia';
import { useEventBus } from '../services/eventBus';

export function useCombat() {
  const app = ref<PIXI.Application | null>(null);
  const gridContainer = ref<PIXI.Container | null>(null);
  const rangeOverlay = ref<PIXI.Container | null>(null);
  const unitStore = useUnitsStore();
  const { units } = storeToRefs(unitStore);
  // delegate event API to central bus
  const { on, off, emit } = useEventBus();
  const combatUnit = useCombatUnit();

  // Interaction controller for drag-and-drop
  let interactionController: ReturnType<typeof setupInteractionController> | null = null;

  const initApp = async (container: HTMLDivElement) => {
    if (app.value) return;

    app.value = new PIXI.Application();
    await app.value.init({
      width: GRID_CONFIG.cols * GRID_CONFIG.cellSize,
      height: GRID_CONFIG.rows * GRID_CONFIG.cellSize,
      backgroundColor: 0x1e1e1e,
      resolution: window.devicePixelRatio || 1,
      antialias: true,
    });

    container.appendChild(app.value.canvas);

    app.value.stage.sortableChildren = true;

    gridContainer.value = createGrid(app.value);
    rangeOverlay.value = createRangeOverlay(app.value);
  };

  const init = async (container: HTMLDivElement) => {
    await initApp(container);
    await preloadFont();
    await preloadHeartIcon();
    // wire interaction controller
    if (app.value) {
      interactionController = setupInteractionController(app.value, () => units.value, {
        pixelToGrid,
        gridToPixel,
        showReachableCells: (gx, gy, r) => showReachableCells(rangeOverlay.value, gx, gy, r),
        hideReachableCells: () => hideReachableCells(rangeOverlay.value),
        moveUnitToGrid: (id, x, y) => moveUnitToGrid(id, x, y),
      });
    }
    console.log('Combat engine initialisé.');
  };

  // createUnit now delegates texture loading + sprite creation
  const createUnit = async (
    unitId: 'player' | `enemy-${number}`,
    gridX = 6,
    gridY = 4,
    maxMoveRange = 3,
    characterKey: availableCharacterKeys = 'Archer-Green' as const,
    hp = 100,
    maxHp = 100,
  ) => {
    if (!app.value) return null;
    const animations = await loadTextures(characterKey);
    const idleKey = 'idle_bottom';
    if (!animations[idleKey] || animations[idleKey].length === 0) {
      console.error('No idle textures');
      return null;
    }
    const sprite = new PIXI.AnimatedSprite(animations[idleKey]);
    const animCfg = animationConfig[idleKey];
    sprite.animationSpeed = animCfg?.speed ?? 0.05;
    sprite.loop = true;
    sprite.anchor.set(0.5);
    sprite.scale.set(2);
    sprite.zIndex = 1;
    const { x, y } = gridToPixel(gridX, gridY);
    sprite.position.set(x, y);
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';

    sprite.play();
    app.value.stage.addChild(sprite);

    // IMPORTANT: Store unit in Pinia BEFORE attaching pointer handlers,
    // so that interactionController can find it when startDrag is called
    const healthBar = combatUnit.createUnitEntry(
      unitId,
      sprite,
      animations,
      gridX,
      gridY,
      maxMoveRange,
      hp,
      maxHp,
    );
    if (healthBar?.container) {
      healthBar.container.position.set(x, y - 40);
      app.value.stage.addChild(healthBar.container);
    }

    // Now attach pointer handler after unit is guaranteed in store
    sprite.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      if (interactionController?.startDrag) {
        interactionController.startDrag(unitId);
      } else {
        console.warn('[useCombat] interactionController not initialized');
      }
      const isPlayer = unitId.startsWith('player');
      emit('unit:clicked', {
        unitId,
        isPlayer,
        stageX: event.global.x,
        stageY: event.global.y,
      });
    });

    return sprite;
  };

  // movement logic: choose animations, animate sprite, update state via unitService
  const getDirectionFromDelta = (dx: number, dy: number) => {
    if (dx === 0 && dy > 0) return 'bottom';
    if (dx === 0 && dy < 0) return 'top';
    if (dx > 0 && dy === 0) return 'right';
    if (dx < 0 && dy === 0) return 'left';
    if (dx > 0 && dy > 0) return 'bottom_right';
    if (dx > 0 && dy < 0) return 'top_right';
    if (dx < 0 && dy > 0) return 'bottom_left';
    if (dx < 0 && dy < 0) return 'top_left';
    return 'bottom';
  };

  const moveUnitToGrid = (unitId: string, targetGridX: number, targetGridY: number) => {
    const u = units.value.get(unitId);
    if (!u || !app.value) return;
    const { sprite, animations } = u;
    const { x: targetX, y: targetY } = gridToPixel(targetGridX, targetGridY);
    const dx = targetGridX - u.gridX;
    const dy = targetGridY - u.gridY;
    const dir = getDirectionFromDelta(dx, dy);

    const walkKey = `walk_${dir}`;
    if (animations[walkKey] && animations[walkKey].length > 0 && animationConfig[walkKey]) {
      sprite.textures = animations[walkKey];
      sprite.animationSpeed = animationConfig[walkKey].speed;
      sprite.play();
    }

    gsap.to(sprite, {
      x: targetX,
      y: targetY,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => {
        const idleKey = `idle_${dir}`;
        if (animations[idleKey] && animations[idleKey].length > 0 && animationConfig[idleKey]) {
          sprite.textures = animations[idleKey];
          sprite.animationSpeed = animationConfig[idleKey].speed;
          sprite.loop = true;
          sprite.play();
        }
        combatUnit.moveUnitState(unitId, targetGridX, targetGridY);
        if (u.healthBar?.container) u.healthBar.container.position.set(targetX, targetY - 40);
        emit('turn:ended', { roundNumber: 0 }); // placeholder emit, adapt if needed
      },
    });
  };

  const updateUnitHealth = (unitId: string, damage: number) => {
    const u = units.value.get(unitId);
    if (!u) return;
    const newHp = Math.max(0, u.hp - damage);
    combatUnit.updateHp(unitId, newHp);
    emit('unit:attacked', {
      attackerId: 'unknown',
      targetId: unitId,
      damage,
    });
    if (newHp === 0) emit('unit:died', { unitId });
  };

  // wire setupDragEvents to stage-level handlers if needed (keeps compatibility)
  const setupDragEvents = () => {
    if (!app.value) return;
    app.value.stage.eventMode = 'static';
    app.value.stage.hitArea = app.value.screen;
    // event handlers are installed by interactionController during init
  };

  onUnmounted(() => {
    interactionController = null;
    if (!app.value) return;
    app.value.destroy(true);
  });

  return {
    init,
    createUnit,
    moveUnitToGrid,
    setupDragEvents,
    updateUnitHealth,
    on,
    off,
    emit,
  };
}
