export interface AnimConfig {
  row: number;
  frames: number;
  speed: number;
  xOffset?: number;
}

export const frameWidth = 32;
export const frameHeight = 32;

// Direction order mapped to rows 0..7
export const DIRECTIONS = [
  "bottom",
  "bottom_right",
  "right",
  "top_right",
  "top",
  "top_left",
  "left",
  "bottom_left",
] as const;

export type Direction = (typeof DIRECTIONS)[number];

const ANIM_TYPES = {
  idle: { frames: 2, speed: 0.05 },
  walk: { frames: 2, speed: 0.05 },
  attack: { frames: 4, speed: 0.25 },
  bow: { frames: 4, speed: 0.25 },
  wand: { frames: 3, speed: 0.25 },
  run: { frames: 3, speed: 0.1 },
  hurt: { frames: 3, speed: 0.1 },
  death: { frames: 3, speed: 0.05 },
} as const;

export type AnimType = keyof typeof ANIM_TYPES;

// Calculate X offset for each animation type (cumulative frame count)
const animTypeOrder = Object.keys(ANIM_TYPES) as AnimType[];
const animXOffsets: Record<AnimType, number> = {} as Record<AnimType, number>;
let cumulativeFrames = 0;
animTypeOrder.forEach(animType => {
  animXOffsets[animType] = cumulativeFrames;
  cumulativeFrames += ANIM_TYPES[animType].frames;
});

export const animations: Record<`${AnimType}_${Direction}`, AnimConfig> = Object.entries(ANIM_TYPES)
  .flatMap(([animType, animCfg]) => {
    const xOffset = animXOffsets[animType as AnimType];
    console.log(animType, animCfg, "xOffset:", xOffset);
    return DIRECTIONS.map((dir, dirIdx): [string, AnimConfig] => [
      `${animType}_${dir}`,
      { row: dirIdx, frames: animCfg.frames, speed: animCfg.speed, xOffset },
    ]);
  })
  .reduce<Record<string, AnimConfig>>((acc, [key, cfg]) => {
    acc[key] = cfg;
    return acc;
  }, {});
