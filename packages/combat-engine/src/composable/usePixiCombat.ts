import { ref, onUnmounted } from 'vue';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';
import { animations as animationConfig, frameWidth, frameHeight, DIRECTIONS } from './spritesAnimations';

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
    eventListeners.get(event)?.delete(handler as EventHandler<CombatEngineEventType>);
  };

  const emit = <T extends CombatEngineEventType>(event: T, payload: CombatEngineEventPayload[T]) => {
    eventListeners.get(event)?.forEach(handler => handler(payload));
  };

  let isDragging = false;
  let dragTarget: string | null = null;

  // Convertir position pixel -> grille
  const pixelToGrid = (x: number, y: number) => {
    return {
      gridX: Math.floor(x / GRID_CONFIG.cellSize),
      gridY: Math.floor(y / GRID_CONFIG.cellSize),
    };
  };

  // Convertir position grille -> pixel (centre de la case)
  const gridToPixel = (gridX: number, gridY: number) => {
    return {
      x: gridX * GRID_CONFIG.cellSize + GRID_CONFIG.cellSize / 2,
      y: gridY * GRID_CONFIG.cellSize + GRID_CONFIG.cellSize / 2,
    };
  };

  // Calculer la distance Manhattan entre deux cases
  const getManhattanDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.abs(x2 - x1) + Math.abs(y2 - y1);
  };

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
    lines.setStrokeStyle({ width: 1, color: GRID_CONFIG.lineColor, alpha: GRID_CONFIG.lineAlpha });

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
          cell.fill({ color: GRID_CONFIG.reachableColor, alpha: GRID_CONFIG.reachableAlpha });
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

  // Initialisation de l'application Pixi
  const init = async (container: HTMLDivElement) => {
    if (app.value) return;

    app.value = new PIXI.Application();

    await app.value.init({
      width: GRID_CONFIG.cols * GRID_CONFIG.cellSize,
      height: GRID_CONFIG.rows * GRID_CONFIG.cellSize,
      backgroundColor: 0x1a1a2e,
      resolution: window.devicePixelRatio || 1,
      antialias: true,
    });

    container.appendChild(app.value.canvas as HTMLCanvasElement);

    // Activer le tri par zIndex
    app.value.stage.sortableChildren = true;

    // Créer la grille et l'overlay
    createGrid();
    createRangeOverlay();
    await PIXI.Assets.load({
      alias: 'HealthBarFont',
      src: '/Literata-Medium.fnt',
    });
    console.log('PixiJS initialisé avec grille damier.');
  };

  // Helper to compute 8-direction string based on dx/dy
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

  // DONT FUCKING TOUCH THIS MOFO
  const loadAssets = async (characterKey = 'Archer-Green') => {
    try {
      console.log('Loading texture for character:', characterKey);
      const texture = await PIXI.Assets.load(`/puny-characters/${characterKey}.png`);
      console.log('Texture chargée:', texture.width, texture.height);

      const createFrameTexture = (baseTexture: PIXI.Texture, x: number, y: number, w: number, h: number) => {
        return new PIXI.Texture({
          source: baseTexture.source,
          frame: new PIXI.Rectangle(x, y, w, h),
        });
      };

      // Create textures map using computed animationConfig from TS module
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

      console.log('Animations créées:', Object.keys(texturesMap));
      return texturesMap;
    } catch (error) {
      console.error('Erreur de chargement des assets:', error);

      // Fallback with colored rectangles for all oriented keys
      const createColorTexture = (color: number, w = frameWidth || 32, h = frameHeight || 32) => {
        const graphics = new PIXI.Graphics();
        graphics.fill(color);
        graphics.rect(0, 0, w, h);
        graphics.fill();
        return app.value!.renderer.generateTexture(graphics);
      };

      const directions = Array.from(DIRECTIONS);
      const fallbackTextures: Record<string, PIXI.Texture[]> = {};

      for (const dir of directions) {
        fallbackTextures[`idle_${dir}`] = Array(2).fill(0).map(() => createColorTexture(0x4CAF50));
        fallbackTextures[`walk_${dir}`] = Array(2).fill(0).map(() => createColorTexture(0x2196F3));
        fallbackTextures[`attack_${dir}`] = Array(4).fill(0).map(() => createColorTexture(0xff5722));
        fallbackTextures[`death_${dir}`] = Array(4).fill(0).map(() => createColorTexture(0x000000));
      }

      return fallbackTextures;
    }
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
    return { container, bg, fill, text, update };
  };

  // Créer une unité
  const createUnit = async (
    unitId: string,
    gridX = 6,
    gridY = 4,
    maxMoveRange = 3,
    characterKey = 'Archer-Green',
    hp = 100,
    maxHp = 100,
  ) => {
    if (!app.value) return null;

    const textures = await loadAssets(characterKey);

    // Default to idle_bottom
    const idleKey = 'idle_bottom';
    if (!textures[idleKey] || textures[idleKey].length === 0) {
      console.error('Pas de textures IDLE disponibles');
      return null;
    }

    const sprite = new PIXI.AnimatedSprite(textures[idleKey]);

    // Récupérer la vitesse depuis la config
    const animConfig = animationConfig[idleKey];

    // Configuration
    sprite.animationSpeed = animConfig?.speed ?? 0.05;
    sprite.loop = true;
    sprite.anchor.set(0.5);
    sprite.scale.set(2);
    sprite.zIndex = 1;

    // Position initiale sur la grille
    const { x, y } = gridToPixel(gridX, gridY);
    sprite.position.set(x, y);

    // Rendre le sprite interactif
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';

    // Événements de drag & drop
    sprite.on('pointerdown', () => {
      isDragging = true;
      dragTarget = unitId;
      const unitData = units.value.get(unitId);
      if (unitData) {
        showReachableCells(unitData.gridX, unitData.gridY, unitData.maxMoveRange);
      }
      // Emit unit:clicked event for external subscribers
      // isPlayer is determined by the unitId prefix (convention: 'player' vs 'enemy')
      const isPlayer = unitId.startsWith('player');
      emit('unit:clicked', { unitId, isPlayer });
    });

    sprite.play();
    app.value.stage.addChild(sprite);

    const healthBar = createHealthBar(hp, maxHp);
    healthBar.container.position.set(x, y - 40);
    app.value.stage.addChild(healthBar.container);

    // Stocker l'unité (use the textures variable)
    units.value.set(unitId, {
      sprite,
      animations: textures,
      gridX,
      gridY,
      maxMoveRange,
      hp,
      maxHp,
      healthBar,
    });

    return sprite;
  };

  // Gérer les événements globaux de drag
  const setupDragEvents = () => {
    if (!app.value) return;

    app.value.stage.eventMode = 'static';
    app.value.stage.hitArea = app.value.screen;

    app.value.stage.on('pointermove', (event: PIXI.FederatedPointerEvent) => {
      if (!isDragging || !dragTarget) return;

      const unitData = units.value.get(dragTarget);
      if (!unitData) return;

      // Suivre la souris pendant le drag
      unitData.sprite.position.copyFrom(event.global);
      unitData.healthBar.container.position.set(event.global.x, event.global.y - 40);
    });

    app.value.stage.on('pointerup', (event: PIXI.FederatedPointerEvent) => {
      if (!isDragging || !dragTarget) return;

      const unitData = units.value.get(dragTarget);
      if (!unitData) return;

      // Calculer la case la plus proche
      const { gridX: newGridX, gridY: newGridY } = pixelToGrid(event.global.x, event.global.y);

      // Vérifier si la case est dans la portée
      const distance = getManhattanDistance(unitData.gridX, unitData.gridY, newGridX, newGridY);

      if (distance <= unitData.maxMoveRange && newGridX >= 0 && newGridX < GRID_CONFIG.cols && newGridY >= 0 && newGridY < GRID_CONFIG.rows) {
        // Déplacement valide
        moveUnitToGrid(dragTarget, newGridX, newGridY);
      } else {
        // Retour à la position d'origine
        const { x, y } = gridToPixel(unitData.gridX, unitData.gridY);
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
    });

    app.value.stage.on('pointerupoutside', () => {
      if (!isDragging || !dragTarget) return;

      const unitData = units.value.get(dragTarget);
      if (!unitData) return;

      // Retour à la position d'origine
      const { x, y } = gridToPixel(unitData.gridX, unitData.gridY);
      gsap.to(unitData.sprite, {
        x,
        y,
        duration: 0.3,
        ease: 'back.out',
      });

      hideReachableCells();
      isDragging = false;
      dragTarget = null;
    });
  };

  // Déplacer une unité vers une case de la grille
  const moveUnitToGrid = (unitId: string, targetGridX: number, targetGridY: number) => {
    const unitData = units.value.get(unitId);
    if (!unitData || !app.value) return;

    const { sprite, animations } = unitData;
    const { x: targetX, y: targetY } = gridToPixel(targetGridX, targetGridY);

    // Compute direction key based on delta
    const dx = targetGridX - unitData.gridX;
    const dy = targetGridY - unitData.gridY;
    const dir = getDirectionFromDelta(dx, dy);

    // Choose walk animation by direction (use fallback if missing)
    const walkKey = `walk_${dir}`;
    if (!animations[walkKey] || animations[walkKey].length === 0 || !animationConfig[walkKey]) {
      console.error(`No walk animation or config for ${walkKey}`);
      return;
    }
    sprite.textures = animations[walkKey];
    sprite.animationSpeed = animationConfig[walkKey].speed;
    sprite.play();

    // Animation de mouvement
    gsap.to(sprite, {
      x: targetX,
      y: targetY,
      duration: 0.5,
      ease: 'power2.inOut',
      onComplete: () => {
        // Revenir à l'animation IDLE by direction (fallback)
        const idleKey = `idle_${dir}`;
        if (!animations[idleKey] || animations[idleKey].length === 0 || !animationConfig[idleKey]) {
          console.error(`No idle animation or config for ${idleKey}`);
          return;
        }
        sprite.textures = animations[idleKey];
        sprite.animationSpeed = animationConfig[idleKey].speed;
        console.log(`Setting idle speed for ${idleKey}:`, sprite.animationSpeed);

        sprite.loop = true;
        sprite.play();

        // Mettre à jour la position sur la grille
        unitData.gridX = targetGridX;
        unitData.gridY = targetGridY;
        unitData.healthBar.container.position.set(targetX, targetY - 40);
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

    // 1. Logique métier : Calcul des nouveaux HP
    const newHp = Math.max(0, unitData.hp - damage);
    unitData.hp = newHp;

    // 2. Logique de rendu : Appel de la méthode d'update de la HealthBar
    // NOTE : On suppose que createHealthBar retourne { container, update }
    if (unitData.healthBar && unitData.healthBar.update) {
      unitData.healthBar.update(newHp);
      console.log(`Unité ${unitId} PV: ${newHp}/${unitData.maxHp}`);
    } else {
      console.error('Barre de vie non initialisée pour cette unité.');
    }
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
