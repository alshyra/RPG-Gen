import { shallowRef, onUnmounted, markRaw } from 'vue';
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
  // PERFORMANCE: Use shallowRef for PIXI objects to avoid deep reactivity
  const app = shallowRef<PIXI.Application | null>(null);
  const gridContainer = shallowRef<PIXI.Container | null>(null);
  const rangeOverlay = shallowRef<PIXI.Container | null>(null);
  const unitStore = useUnitsStore();
  const { units } = storeToRefs(unitStore);
  // delegate event API to central bus
  const { on, off, emit } = useEventBus();
  const combatUnit = useCombatUnit();

  // Interaction controller for drag-and-drop
  let interactionController: ReturnType<typeof setupInteractionController> | null = null;
  let handleUnitAttackedRef:
    | ((payload: {
        attackerId: string;
        targetId: string;
        damage: number;
        isCrit?: boolean;
      }) => void)
    | null = null;

  const initApp = async (container: HTMLDivElement) => {
    if (app.value) return;

    // PERFORMANCE: markRaw to prevent Vue from making PIXI app reactive
    const pixiApp = markRaw(new PIXI.Application());
    await pixiApp.init({
      width: GRID_CONFIG.cols * GRID_CONFIG.cellSize,
      height: GRID_CONFIG.rows * GRID_CONFIG.cellSize,
      backgroundColor: 0x1e1e1e,
      resolution: Math.min(window.devicePixelRatio || 1, 2), // Cap at 2x for performance
      antialias: false, // Disable antialiasing for better performance
      preference: 'webgl', // Force WebGL if available
      powerPreference: 'high-performance',
    });

    container.appendChild(pixiApp.canvas);

    pixiApp.stage.sortableChildren = true;
    app.value = pixiApp;

    // Listen to attack events from external callers to show floating indicators
    handleUnitAttackedRef = (payload: {
      attackerId: string;
      targetId: string;
      damage: number;
      isCrit?: boolean;
    }) => {
      if (!app.value?.stage) return;
      const u = units.value.get(payload.targetId);
      if (!u || !u.sprite) return;

      const x = u.sprite.x;
      const y = (u.healthBar?.container?.y ?? u.sprite.y) - 20;

      const isMiss = !payload.damage || payload.damage <= 0;
      const label = isMiss
        ? 'Miss'
        : payload.isCrit
          ? `CRIT! -${payload.damage}`
          : `-${payload.damage}`;

      const textStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: payload.isCrit ? 28 : 20,
        fill: isMiss ? '#9ca3af' : payload.isCrit ? '#ffdd57' : '#ffffff',
        stroke: {
          color: '#000000',
          width: 4,
        },
        dropShadow: {
          color: '#000000',
          blur: 6,
        },
      });

      const text = new PIXI.Text({ text: label, style: textStyle });
      text.anchor.set(0.5);
      text.x = x;
      text.y = y;
      text.zIndex = 1000;
      app.value.stage.addChild(text);

      // Animate: float up and fade out
      gsap.to(text, {
        y: y - 40,
        alpha: 0,
        duration: 1.0,
        ease: 'power2.out',
        onComplete: () => {
          if (text && text.parent) text.parent.removeChild(text);
          // @ts-ignore
          text.destroy({ children: true, texture: false, baseTexture: false });
        },
      });
    };

    on('unit:attacked', handleUnitAttackedRef);

    gridContainer.value = createGrid(app.value);
    rangeOverlay.value = createRangeOverlay(app.value);
  };

  const init = async (container: HTMLDivElement) => {
    await initApp(container);
    await preloadFont();
    await preloadHeartIcon();
    // wire interaction controller
    if (app.value) {
      // storeToRefs wraps the ref, we need to pass a callback that returns the unwrapped value
      // The type system needs help here due to Vue's Ref wrapping
      const unitsRef = units as unknown as typeof units;
      interactionController = setupInteractionController(app.value, () => unitsRef.value, {
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
    unitId: string,
    gridX = 6,
    gridY = 4,
    maxMoveRange = 3,
    characterKey: availableCharacterKeys = 'Archer-Green' as const,
    hp = 100,
    maxHp = 100,
    isPlayerUnit = false,
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
    sprite.animationSpeed = (animCfg?.speed ?? 0.05) * 0.7; // Slow down animations for better performance
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

    // Register player unit in store if applicable
    if (isPlayerUnit) {
      unitStore.registerPlayerUnit(unitId);
    }

    // Now attach pointer handler after unit is guaranteed in store
    sprite.on('pointerdown', (event: PIXI.FederatedPointerEvent) => {
      const isPlayer = unitStore.isPlayerUnit(unitId);

      // Only allow player unit to be dragged
      if (isPlayer && interactionController?.startDrag) {
        interactionController.startDrag(unitId);
      } else if (!isPlayer) {
        console.debug('[useCombat] Enemy unit cannot be dragged:', unitId);
      }

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

    // Validate that target is within movement range (Manhattan distance)
    const distance = Math.abs(targetGridX - u.gridX) + Math.abs(targetGridY - u.gridY);
    if (distance > u.maxMoveRange) {
      console.warn(
        `[useCombat] Move rejected: distance ${distance} exceeds max range ${u.maxMoveRange} for unit ${unitId}`,
      );
      // Revert sprite position to current grid location
      const { x: currentX, y: currentY } = gridToPixel(u.gridX, u.gridY);
      gsap.to(u.sprite, {
        x: currentX,
        y: currentY,
        duration: 0.3,
        ease: 'power2.out',
      });
      if (u.healthBar?.container) {
        gsap.to(u.healthBar.container, {
          x: currentX,
          y: currentY - 40,
          duration: 0.3,
          ease: 'power2.out',
        });
      }
      return;
    }

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

  /**
   * Remove all units from the PIXI stage and clear the units store.
   * This ensures switching from demo → real combat (or re-initializing)
   * doesn't leave orphaned sprites on the stage and avoids visual duplicates.
   */
  const clearAllUnits = () => {
    if (!app.value) {
      unitStore.clearAllUnits();
      return;
    }

    try {
      Array.from(units.value.entries()).forEach(([id, unit]) => {
        unit.sprite.parent!.removeChild(unit.sprite);
        unit.sprite.destroy({ children: true, texture: false, baseTexture: false });
        unit.healthBar.container.parent!.removeChild(unit.healthBar.container);
        unit.healthBar.container.destroy({ children: true });
      });
    } finally {
      // Clear the pinia store maps/sets
      unitStore.clearAllUnits();
    }
  };

  onUnmounted(() => {
    interactionController = null;
    if (!app.value) return;
    app.value.destroy(true);
    // remove global listeners to avoid leaks
    if (handleUnitAttackedRef) {
      off('unit:attacked', handleUnitAttackedRef);
    }
  });
  return {
    init,
    createUnit,
    clearAllUnits,
    moveUnitToGrid,
    setupDragEvents,
    updateUnitHealth,
    on,
    off,
    emit,
    getApp: () => app.value,
  };
}
