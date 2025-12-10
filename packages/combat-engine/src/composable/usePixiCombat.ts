import type { availableCharacterKeys } from '@/types/combat-types';
import { gsap } from 'gsap';
import * as PIXI from 'pixi.js';
import { onUnmounted, ref } from 'vue';
import {
  animations as animationConfig,
  frameHeight,
  frameWidth,
} from './spritesAnimations';

// Interface pour stocker les données d'unité
interface UnitData {
  sprite: PIXI.AnimatedSprite;
  animations: Record<string, PIXI.Texture[]>;
  gridX: number;
  gridY: number;
  maxMoveRange: number;
  hp: number;
  maxHp: number;
  healthBar: {
    container: PIXI.Container;
    bg: PIXI.Graphics;
    fill: PIXI.Graphics;
    text: PIXI.BitmapText;
    update: (newHp: number) => void;
  };
}

// Configuration de la grille
const GRID_CONFIG = {
  cellSize: 64,
  cols: 12,
  rows: 9,
  lineColor: 0x2d5016,
  lineAlpha: 0.6,
  tileColor1: 0x5a9c3f,
  tileColor2: 0x4a7c2f,
  reachableColor: 0xffd700,
  reachableAlpha: 0.4,
};

// Event types for external subscribers
export type CombatEngineEventType = 'unit:clicked' | 'unit:attacked' | 'unit:died' | 'turn:ended';

export interface UnitClickedPayload {
  unitId: string;
  isPlayer: boolean;
}

export interface UnitAttackedPayload {
  attackerId: string;
  targetId: string;
  damage: number;
  isCrit?: boolean;
}

export interface CombatEngineEventPayload {
  'unit:clicked': UnitClickedPayload;
  'unit:attacked': UnitAttackedPayload;
  'unit:died': { unitId: string };
  'turn:ended': { roundNumber: number };
}

type EventHandler<T extends CombatEngineEventType> = (payload: CombatEngineEventPayload[T]) => void;

export function usePixiCombat() {
  const app = ref<PIXI.Application | null>(null);
  const units = ref<Map<string, UnitData>>(new Map());
  const gridContainer = ref<PIXI.Container | null>(null);
  const rangeOverlay = ref<PIXI.Container | null>(null);

  // Event emitter internals
  const eventListeners = new Map<CombatEngineEventType, Set<EventHandler<CombatEngineEventType>>>();

  const on = <T extends CombatEngineEventType>(event: T, handler: EventHandler<T>) => {
    if (!eventListeners.has(event)) {
      eventListeners.set(event, new Set());
    }
    eventListeners.get(event)!.add(handler as EventHandler<CombatEngineEventType>);
  };

  const off = <T extends CombatEngineEventType>(event: T, handler: EventHandler<T>) => {
    eventListeners.get(event)
      ?.delete(handler as EventHandler<CombatEngineEventType>);
  };

  const emit = <T extends CombatEngineEventType>(event: T, payload: CombatEngineEventPayload[T]) => {
    eventListeners.get(event)
      ?.forEach(handler => handler(payload));
  };

  let isDragging = false;
  let dragTarget: string | null = null;

  // Convertir position pixel -> grille
  const pixelToGrid = (x: number, y: number) => ({
    gridX: Math.floor(x / GRID_CONFIG.cellSize),
    gridY: Math.floor(y / GRID_CONFIG.cellSize),
  });

  // Convertir position grille -> pixel (centre de la case)
  const gridToPixel = (gridX: number, gridY: number) => ({
    x: gridX * GRID_CONFIG.cellSize + GRID_CONFIG.cellSize / 2,
    y: gridY * GRID_CONFIG.cellSize + GRID_CONFIG.cellSize / 2,
  });

  // Calculer la distance Manhattan entre deux cases
  const getManhattanDistance = (x1: number, y1: number, x2: number, y2: number) => Math.abs(x2 - x1) + Math.abs(y2 - y1);

  // Créer la grille visuelle avec damier
  const createGrid = () => {
    if (!app.value) return;

    gridContainer.value = new PIXI.Container();
    gridContainer.value.zIndex = 0;

    // Créer les tuiles en damier
    for (let row = 0; row < GRID_CONFIG.rows; row++) {
      for (let col = 0; col < GRID_CONFIG.cols; col++) {
        const tile = new PIXI.Graphics();
        const isEven = (row + col) % 2 === 0;
        const color = isEven ? GRID_CONFIG.tileColor1 : GRID_CONFIG.tileColor2;

        tile.rect(
          col * GRID_CONFIG.cellSize,
          row * GRID_CONFIG.cellSize,
          GRID_CONFIG.cellSize,
          GRID_CONFIG.cellSize,
        );
        tile.fill({ color });

        gridContainer.value.addChild(tile);
      }
    }

    // Ajouter les lignes de grille
    const lines = new PIXI.Graphics();
    lines.setStrokeStyle({
      width: 1,
      color: GRID_CONFIG.lineColor,
      alpha: GRID_CONFIG.lineAlpha,
    });

    // Lignes verticales
    for (let i = 0; i <= GRID_CONFIG.cols; i++) {
      const x = i * GRID_CONFIG.cellSize;
      lines.moveTo(x, 0);
      lines.lineTo(x, GRID_CONFIG.rows * GRID_CONFIG.cellSize);
      lines.stroke();
    }

    // Lignes horizontales
    for (let i = 0; i <= GRID_CONFIG.rows; i++) {
      const y = i * GRID_CONFIG.cellSize;
      lines.moveTo(0, y);
      lines.lineTo(GRID_CONFIG.cols * GRID_CONFIG.cellSize, y);
      lines.stroke();
    }

    gridContainer.value.addChild(lines);
    app.value.stage.addChild(gridContainer.value as PIXI.Container);
  };

  // Créer l'overlay de portée
  const createRangeOverlay = () => {
    if (!app.value) return;

    rangeOverlay.value = new PIXI.Container();
    rangeOverlay.value.zIndex = 0.5;
    app.value.stage.addChild(rangeOverlay.value as PIXI.Container);
  };

  // Afficher les cases accessibles
  const showReachableCells = (originGridX: number, originGridY: number, range: number) => {
    if (!rangeOverlay.value) return;

    // Nettoyer l'overlay précédent
    rangeOverlay.value.removeChildren();

    for (let x = 0; x < GRID_CONFIG.cols; x++) {
      for (let y = 0; y < GRID_CONFIG.rows; y++) {
        const distance = getManhattanDistance(originGridX, originGridY, x, y);

        if (distance > 0 && distance <= range) {
          const cell = new PIXI.Graphics();
          cell.rect(
            x * GRID_CONFIG.cellSize,
            y * GRID_CONFIG.cellSize,
            GRID_CONFIG.cellSize,
            GRID_CONFIG.cellSize,
          );
          cell.fill({
            color: GRID_CONFIG.reachableColor,
            alpha: GRID_CONFIG.reachableAlpha,
          });
          rangeOverlay.value.addChild(cell);
        }
      }
    }
  };

  // Masquer les cases accessibles
  const hideReachableCells = () => {
    if (!rangeOverlay.value) return;
    rangeOverlay.value.removeChildren();
  };

  // Helpers extraits pour init
  const initApp = async (container: HTMLDivElement) => {
    if (app.value) return;
    console.log('Entering init app');
    app.value = new PIXI.Application();

    await app.value.init({
      width: GRID_CONFIG.cols * GRID_CONFIG.cellSize,
      height: GRID_CONFIG.rows * GRID_CONFIG.cellSize,
      backgroundColor: 0x1a1a2e,
      resolution: window.devicePixelRatio || 1,
      antialias: true,
    });

    container.appendChild(app.value.canvas);

    app.value.stage.sortableChildren = true;

    createGrid();
    createRangeOverlay();
  };

  const loadFont = async () => {
    if (!app.value) return;
    await PIXI.Assets.load({
      alias: 'HealthBarFont',
      src: '/Literata-Medium.fnt',
    });
  };

  // Helper functions for loadAssets
  const createFrameTexture = (baseTexture: PIXI.Texture, x: number, y: number, w: number, h: number) => new PIXI.Texture({
    source: baseTexture.source,
    frame: new PIXI.Rectangle(x, y, w, h),
  });

  const buildTexturesFromAtlas = (texture: PIXI.Texture) => {
    const texturesMap: Record<string, PIXI.Texture[]> = {};
    const w = frameWidth;
    const h = frameHeight;

    for (const [animName, animCfg] of Object.entries(animationConfig)) {
      const frames: PIXI.Texture[] = [];
      for (let i = 0; i < animCfg.frames; i++) {
        frames.push(
          createFrameTexture(
            texture,
            i * w,
            animCfg.row * h,
            w,
            h,
          ),
        );
      }
      texturesMap[animName] = frames;
    }
    return texturesMap;
  };

  // Réécriture de loadAssets en orchestrateur léger
  const loadAssets = async (characterKey: availableCharacterKeys = 'Archer-Green' as const) => {
    if (!app.value) {
      console.warn('App non initialisé lors du chargement des assets.');
      // still attempt to load atlas (PIXI can load without renderer)
    }
    const texture = await PIXI.Assets.load(`/puny-characters/${characterKey}.png`);
    // Some PIXI Asset loaders return baseTexture or Texture; normalize to Texture
    const tex = (texture as PIXI.Texture) || new PIXI.Texture((texture).baseTexture);

    return buildTexturesFromAtlas(tex);
  };

  // Créer une barre de vie
  const createHealthBar = (hp: number, maxHp: number) => {
    const container = new PIXI.Container();
    container.zIndex = 2;

    // Background bar
    const bg = new PIXI.Graphics();
    bg.rect(0, 0, 50, 8);
    bg.fill({ color: 0x333333 });
    container.addChild(bg);

    // Fill bar
    const fill = new PIXI.Graphics();
    const ratio = hp / maxHp;
    const color = ratio > 0.5 ? 0x00ff00 : ratio > 0.25 ? 0xffff00 : 0xff0000;
    fill.rect(0, 0, 50 * ratio, 8);
    fill.fill({ color });
    container.addChild(fill);

    // Text
    const text = new PIXI.BitmapText({
      text: `${hp}/${maxHp}`,
      style: {
        fontFamily: 'HealthBarFont', // <-- Utilisation de l'alias
        fontSize: 10, // Cette taille doit correspondre à la taille exportée
      },
    });
    text.anchor.set(0.5);
    text.position.set(25, 4);
    container.addChild(text);

    // Mettre à jour la barre de vie
    const update = (newHp: number) => {
      // La logique de mise à jour interne (utilise les variables 'fill' et 'text' du scope)
      const ratio = newHp / maxHp;
      const color = ratio > 0.5 ? 0x00ff00 : ratio > 0.25 ? 0xffff00 : 0xff0000;

      fill.clear();
      fill.rect(0, 0, 50 * ratio, 8);
      fill.fill({ color });

      // text.text = `${newHp}/${maxHp}`;
      // Pas besoin de mettre à jour maxHp ici si elle est constante pour cette barre
    };
    return {
      container,
      bg,
      fill,
      text,
      update,
    };
  };

  // Helper pour créer le sprite et configurer ses propriétés
  const createSpriteForUnit = (textures: Record<string, PIXI.Texture[]>, startGridX: number, startGridY: number) => {
    const idleKey = 'idle_bottom';
    if (!textures[idleKey] || textures[idleKey].length === 0) {
      throw new Error('Pas de textures IDLE disponibles');
    }

    const sprite = new PIXI.AnimatedSprite(textures[idleKey]);
    const animConfig = animationConfig[idleKey];

    sprite.animationSpeed = animConfig?.speed ?? 0.05;
    sprite.loop = true;
    sprite.anchor.set(0.5);
    sprite.scale.set(2);
    sprite.zIndex = 1;

    const {
      x, y,
    } = gridToPixel(startGridX, startGridY);
    sprite.position.set(x, y);

    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';

    return sprite;
  };

  // Helper pour attacher les events au sprite (séparé pour lisibilité)
  const attachSpriteEvents = (sprite: PIXI.AnimatedSprite, unitId: string) => {
    sprite.on('pointerdown', () => {
      isDragging = true;
      dragTarget = unitId;
      const unitData = units.value.get(unitId);
      if (unitData) {
        showReachableCells(unitData.gridX, unitData.gridY, unitData.maxMoveRange);
      }
      const isPlayer = unitId.startsWith('player');
      emit('unit:clicked', {
        unitId,
        isPlayer,
      });
    });
  };

  // Finaliser la création de l'unité (ajout au stage, healthbar, stockage)
  const finalizeUnitCreation = (unitId: string, sprite: PIXI.AnimatedSprite, animations: Record<string, PIXI.Texture[]>, gridX: number, gridY: number, maxMoveRange: number, hp: number, maxHp: number) => {
    if (!app.value) return;
    sprite.play();
    app.value.stage.addChild(sprite);

    const healthBar = createHealthBar(hp, maxHp);
    const {
      x, y,
    } = gridToPixel(gridX, gridY);
    healthBar.container.position.set(x, y - 40);
    app.value.stage.addChild(healthBar.container);

    units.value.set(unitId, {
      sprite,
      animations,
      gridX,
      gridY,
      maxMoveRange,
      hp,
      maxHp,
      healthBar,
    });
  };

  // Créer une unité (orchestration utilisant les helpers)
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

    const textures = await loadAssets(characterKey);

    try {
      const sprite = createSpriteForUnit(textures, gridX, gridY);
      attachSpriteEvents(sprite, unitId);
      finalizeUnitCreation(unitId, sprite, textures, gridX, gridY, maxMoveRange, hp, maxHp);
      return sprite;
    } catch (e) {
      console.error('Erreur création unité:', e);
      return null;
    }
  };

  // Handlers séparés pour setupDragEvents
  const handlePointerMove = (event: PIXI.FederatedPointerEvent) => {
    if (!isDragging || !dragTarget) return;
    const unitData = units.value.get(dragTarget);
    if (!unitData) return;
    unitData.sprite.position.copyFrom(event.global);
    unitData.healthBar.container.position.set(event.global.x, event.global.y - 40);
  };

  const handlePointerUp = (event: PIXI.FederatedPointerEvent) => {
    if (!isDragging || !dragTarget) return;
    const unitData = units.value.get(dragTarget);
    if (!unitData) return;

    const {
      gridX: newGridX, gridY: newGridY,
    } = pixelToGrid(event.global.x, event.global.y);
    const distance = getManhattanDistance(unitData.gridX, unitData.gridY, newGridX, newGridY);

    if (distance <= unitData.maxMoveRange && newGridX >= 0 && newGridX < GRID_CONFIG.cols && newGridY >= 0 && newGridY < GRID_CONFIG.rows) {
      moveUnitToGrid(dragTarget, newGridX, newGridY);
    } else {
      const {
        x, y,
      } = gridToPixel(unitData.gridX, unitData.gridY);
      gsap.to(unitData.sprite, {
        x,
        y,
        duration: 0.3,
        ease: 'back.out',
      });
    }

    hideReachableCells();
    isDragging = false;
    dragTarget = null;
  };

  const handlePointerUpOutside = () => {
    if (!isDragging || !dragTarget) return;
    const unitData = units.value.get(dragTarget);
    if (!unitData) return;
    const {
      x, y,
    } = gridToPixel(unitData.gridX, unitData.gridY);
    gsap.to(unitData.sprite, {
      x,
      y,
      duration: 0.3,
      ease: 'back.out',
    });

    hideReachableCells();
    isDragging = false;
    dragTarget = null;
  };

  // Gérer les événements globaux de drag (orchestrateur)
  const setupDragEvents = () => {
    if (!app.value) return;

    app.value.stage.eventMode = 'static';
    app.value.stage.hitArea = app.value.screen;

    app.value.stage.on('pointermove', handlePointerMove);
    app.value.stage.on('pointerup', handlePointerUp);
    app.value.stage.on('pointerupoutside', handlePointerUpOutside);
  };

  // Helpers pour moveUnitToGrid
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

  const getDirectionKey = (dx: number, dy: number) => getDirectionFromDelta(dx, dy);

  const playWalkAnimation = (sprite: PIXI.AnimatedSprite, animations: Record<string, PIXI.Texture[]>, dir: string) => {
    const walkKey = `walk_${dir}`;
    if (!animations[walkKey] || animations[walkKey].length === 0 || !animationConfig[walkKey]) {
      throw new Error(`No walk animation or config for ${walkKey}`);
    }
    sprite.textures = animations[walkKey];
    sprite.animationSpeed = animationConfig[walkKey].speed;
    sprite.play();
  };

  const completeMove = (sprite: PIXI.AnimatedSprite, animations: Record<string, PIXI.Texture[]>, dir: string, unitData: UnitData, targetGridX: number, targetGridY: number, targetX: number, targetY: number) => {
    const idleKey = `idle_${dir}`;
    if (!animations[idleKey] || animations[idleKey].length === 0 || !animationConfig[idleKey]) {
      console.error(`No idle animation or config for ${idleKey}`);
      return;
    }
    sprite.textures = animations[idleKey];
    sprite.animationSpeed = animationConfig[idleKey].speed;
    sprite.loop = true;
    sprite.play();

    unitData.gridX = targetGridX;
    unitData.gridY = targetGridY;
    unitData.healthBar.container.position.set(targetX, targetY - 40);
  };

  // Déplacer une unité vers une case de la grille (utilise helpers)
  const moveUnitToGrid = (unitId: string, targetGridX: number, targetGridY: number) => {
    const unitData = units.value.get(unitId);
    if (!unitData || !app.value) return;

    const {
      sprite, animations,
    } = unitData;
    const {
      x: targetX, y: targetY,
    } = gridToPixel(targetGridX, targetGridY);

    const dx = targetGridX - unitData.gridX;
    const dy = targetGridY - unitData.gridY;
    const dir = getDirectionKey(dx, dy);

    try {
      playWalkAnimation(sprite, animations, dir);
    } catch (e) {
      console.error(e);
      return;
    }

    gsap.to(sprite, {
      x: targetX,
      y: targetY,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => {
        completeMove(sprite, animations, dir, unitData, targetGridX, targetGridY, targetX, targetY);
      },
    });
  };

  // Nettoyage
  onUnmounted(() => {
    if (!app.value) return;
    app.value.destroy(true);
  });

  const updateUnitHealth = (unitId: string, damage: number) => {
    const unitData = units.value.get(unitId);
    if (!unitData) {
      console.error(`Unité ${unitId} non trouvée.`);
      return;
    }
    const newHp = Math.max(0, unitData.hp - damage);
    unitData.hp = newHp;
    if (unitData.healthBar && unitData.healthBar.update) {
      unitData.healthBar.update(newHp);
      console.log(`Unité ${unitId} PV: ${newHp}/${unitData.maxHp}`);
    } else {
      console.error('Barre de vie non initialisée pour cette unité.');
    }
  };

  // Expose API (init now uses initApp + loadFont)
  const init = async (container: HTMLDivElement) => {
    await initApp(container);
    await loadFont();
    console.log('PixiJS initialisé avec grille damier.');
  };

  return {
    init,
    createUnit,
    moveUnitToGrid,
    setupDragEvents,
    updateUnitHealth,
    // Event API
    on,
    off,
    emit,
  };
}
