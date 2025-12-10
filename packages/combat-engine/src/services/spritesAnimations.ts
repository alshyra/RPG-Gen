export interface AnimConfig {
  row: number;
  frames: number;
  speed: number;
}

export const frameWidth = 32;
export const frameHeight = 32;

// Direction order mapped to rows 0..7
export const DIRECTIONS = [
  'bottom',
  'bottom_right',
  'right',
  'top_right',
  'top',
  'top_left',
  'left',
  'bottom_left',
] as const;

export type Direction = typeof DIRECTIONS[number];

const ANIM_TYPES: Record<string, { frames: number; speed: number }> = {
  idle: { frames: 2, speed: 0.05 },
  walk: { frames: 2, speed: 0.05 },
  attack: { frames: 4, speed: 0.25 },
  death: { frames: 4, speed: 0.1 },
};

export const animations: Record<string, AnimConfig> = Object.entries(ANIM_TYPES)
  .flatMap(([animType, animCfg]) =>
    DIRECTIONS.map((dir, idx): [string, AnimConfig] => [
      `${animType}_${dir}`,
      { row: idx, frames: animCfg.frames, speed: animCfg.speed },
    ]),
  )
  .reduce<Record<string, AnimConfig>>((acc, [key, cfg]) => {
    acc[key] = cfg;
    return acc;
  }, {});

console.log('Loaded animations config:', animations);
