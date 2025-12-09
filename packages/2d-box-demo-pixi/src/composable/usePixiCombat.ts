import { ref, onUnmounted } from 'vue';
import * as PIXI from 'pixi.js';
import { gsap } from 'gsap';

// État de l'animation
enum AnimationState {
  IDLE = 'idle',
  WALK = 'walk',
  ATTACK = 'attack',
  DEATH = 'death',
}

// Interface pour stocker les données d'unité
interface UnitData {
  sprite: PIXI.AnimatedSprite;
  animations: Record<string, PIXI.Texture[]>;
}

export function usePixiCombat() {
  const app = ref<PIXI.Application | null>(null);
  // ✅ Stocker les données complètes de l'unité
  const units = ref<Map<string, UnitData>>(new Map());

  // Initialisation de l'application Pixi
  const init = async (container: HTMLDivElement) => {
    if (app.value) return;

    app.value = new PIXI.Application();

    await app.value.init({
      width: 800,
      height: 600,
      backgroundColor: 0x1099bb,
      resolution: window.devicePixelRatio || 1,
      antialias: true,
    });

    container.appendChild(app.value.canvas as HTMLCanvasElement);
    console.log('PixiJS initialisé et prêt.');
  };

  // ✅ Charger les assets avec la bonne méthode pour PixiJS v8
  const loadAssets = async () => {
    try {
      const texture = await PIXI.Assets.load('/puny-characters/Archer-Green.png');

      console.log('Texture chargée:', texture.width, texture.height);

      // ✅ Méthode correcte pour PixiJS v8
      const createFrameTexture = (baseTexture: PIXI.Texture, x: number, y: number, w: number, h: number) => {
        return new PIXI.Texture({
          source: baseTexture.source,
          frame: new PIXI.Rectangle(x, y, w, h),
        });
      };

      // Créer les frames pour l'animation IDLE (première ligne)
      const idleTextures: PIXI.Texture[] = [];
      for (let i = 0; i < 4; i++) {
        idleTextures.push(createFrameTexture(texture, i * 32, 0, 32, 32));
      }

      // Créer les frames pour l'animation WALK (deuxième ligne)
      const walkTextures: PIXI.Texture[] = [];
      for (let i = 0; i < 6; i++) {
        walkTextures.push(createFrameTexture(texture, i * 32, 32, 32, 32));
      }

      console.log('Textures créées - IDLE:', idleTextures.length, 'WALK:', walkTextures.length);

      return {
        [AnimationState.IDLE]: idleTextures,
        [AnimationState.WALK]: walkTextures,
      };
    } catch (error) {
      console.error('Erreur de chargement des assets:', error);

      // Fallback avec des rectangles de couleur
      const createColorTexture = (color: number) => {
        const graphics = new PIXI.Graphics();
        graphics.rect(0, 0, 32, 32);
        graphics.fill({ color, alpha: 1 });
        return app.value!.renderer.generateTexture(graphics);
      };

      return {
        [AnimationState.IDLE]: Array(4).fill(0).map(() => createColorTexture(0x4CAF50)),
        [AnimationState.WALK]: Array(6).fill(0).map(() => createColorTexture(0x2196F3)),
      };
    }
  };

  // ✅ Factory pour créer une unité
  const createUnit = async (unitId: string, x = 400, y = 300) => {
    if (!app.value) return null;

    // Charger les assets
    const animations = await loadAssets();

    // ✅ Vérifier que les textures existent
    if (!animations[AnimationState.IDLE] || animations[AnimationState.IDLE].length === 0) {
      console.error('Pas de textures IDLE disponibles');
      return null;
    }

    // Créer l'AnimatedSprite avec les textures IDLE
    const sprite = new PIXI.AnimatedSprite(animations[AnimationState.IDLE]);

    // Configuration
    sprite.animationSpeed = 0.15;
    sprite.loop = true;
    sprite.anchor.set(0.5);
    sprite.position.set(x, y);
    sprite.scale.set(3);
    sprite.zIndex = 1;

    // ✅ Démarrer l'animation
    sprite.play();

    // Ajouter au stage
    app.value.stage.addChild(sprite);

    // ✅ Stocker l'unité avec ses animations séparément
    units.value.set(unitId, {
      sprite,
      animations,
    });

    console.log('Unité créée, animation en cours:', sprite.playing);

    return sprite;
  };

  // ✅ Déplacer une unité avec animation
  const moveUnit = (unitId: string, targetX: number, targetY: number) => {
    const unitData = units.value.get(unitId);
    if (!unitData || !app.value) return;

    const { sprite, animations } = unitData;

    // ✅ Changer vers l'animation WALK
    sprite.textures = animations[AnimationState.WALK];
    sprite.play();

    // Retourner le sprite si on va vers la gauche
    if (targetX < sprite.x) {
      sprite.scale.x = -Math.abs(sprite.scale.x);
    } else {
      sprite.scale.x = Math.abs(sprite.scale.x);
    }

    // Animation de mouvement avec GSAP
    gsap.to(sprite, {
      x: targetX,
      y: targetY,
      duration: 2,
      ease: 'power2.inOut',
      onComplete: () => {
        // ✅ Revenir à l'animation IDLE
        sprite.textures = animations[AnimationState.IDLE];
        sprite.play();
      },
    });
  };

  // Nettoyage
  onUnmounted(() => {
    if (app.value) {
      app.value.destroy(true);
    }
  });

  return {
    init,
    createUnit,
    moveUnit,
  };
}
