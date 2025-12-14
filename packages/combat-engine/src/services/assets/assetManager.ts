import * as PIXI from 'pixi.js';
import { animations as animationConfig, frameWidth, frameHeight } from '../spritesAnimations';
import { Texture, Assets } from 'pixi.js';

const createFrameTexture = (base: Texture, x: number, y: number, w: number, h: number): Texture => {
  return new Texture({
    source: base.source,
    frame: new PIXI.Rectangle(x, y, w, h),
  });
};

const buildFromAtlas = (texture: Texture) => {
  return Object.entries(animationConfig)
    .map(([name, cfg]): [string, Texture[]] => {
      const baseX = (cfg.xOffset || 0) * frameWidth;
      const frames = Array.from({ length: cfg.frames }, (_, i) =>
        createFrameTexture(
          texture,
          baseX + i * frameWidth,
          cfg.row * frameHeight,
          frameWidth,
          frameHeight,
        ),
      );
      return [name, frames];
    })
    .reduce<Record<string, Texture[]>>((acc, entry) => {
      const [name, frames] = entry;
      acc[name] = frames;
      return acc;
    }, {});
};

export const preloadFont = async () =>
  Assets.load({
    alias: 'HealthBarFont',
    src: '/Literata-Medium.fnt',
  });

export const preloadHeartIcon = async () =>
  Assets.load({
    alias: 'heart',
    src: '/heart.png',
  });

export const loadTextures = async (characterKey: string): Promise<Record<string, Texture[]>> => {
  const texture = await Assets.load(`/puny-characters/${characterKey}.png`);
  if (texture instanceof Texture) return buildFromAtlas(texture);
  throw new Error(`Failed to load texture for ${characterKey}`);
};
