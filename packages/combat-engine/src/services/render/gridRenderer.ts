import * as PIXI from 'pixi.js';
import { GRID_CONFIG } from '@/types/combat-types';

export const createGrid = (app: PIXI.Application) => {
  if (!app) return null;
  const container = new PIXI.Container();
  container.zIndex = 0;
  for (let row = 0; row < GRID_CONFIG.rows; row++) {
    for (let col = 0; col < GRID_CONFIG.cols; col++) {
      const tile = new PIXI.Graphics();
      const isEven = (row + col) % 2 === 0;
      const color = isEven ? GRID_CONFIG.tileColor1 : GRID_CONFIG.tileColor2;
      tile.beginFill(color);
      tile.drawRect(col * GRID_CONFIG.cellSize, row * GRID_CONFIG.cellSize, GRID_CONFIG.cellSize, GRID_CONFIG.cellSize);
      tile.endFill();
      container.addChild(tile);
    }
  }
  const lines = new PIXI.Graphics();
  lines.lineStyle(1, GRID_CONFIG.lineColor, GRID_CONFIG.lineAlpha);
  for (let i = 0; i <= GRID_CONFIG.cols; i++) {
    const x = i * GRID_CONFIG.cellSize;
    lines.moveTo(x, 0);
    lines.lineTo(x, GRID_CONFIG.rows * GRID_CONFIG.cellSize);
  }
  for (let i = 0; i <= GRID_CONFIG.rows; i++) {
    const y = i * GRID_CONFIG.cellSize;
    lines.moveTo(0, y);
    lines.lineTo(GRID_CONFIG.cols * GRID_CONFIG.cellSize, y);
  }
  container.addChild(lines);
  app.stage.addChild(container);
  return container;
};

export const createRangeOverlay = (app: PIXI.Application) => {
  if (!app) return null;
  const c = new PIXI.Container();
  c.zIndex = 0.5;
  app.stage.addChild(c);
  return c;
};

export const showReachableCells = (overlay: PIXI.Container | null, originGridX: number, originGridY: number, range: number) => {
  if (!overlay) return;
  overlay.removeChildren();
  for (let x = 0; x < GRID_CONFIG.cols; x++) {
    for (let y = 0; y < GRID_CONFIG.rows; y++) {
      const dist = Math.abs(x - originGridX) + Math.abs(y - originGridY);
      if (dist > 0 && dist <= range) {
        const g = new PIXI.Graphics();
        g.beginFill(GRID_CONFIG.reachableColor, GRID_CONFIG.reachableAlpha);
        g.drawRect(x * GRID_CONFIG.cellSize, y * GRID_CONFIG.cellSize, GRID_CONFIG.cellSize, GRID_CONFIG.cellSize);
        g.endFill();
        overlay.addChild(g);
      }
    }
  }
};

export const hideReachableCells = (overlay: PIXI.Container | null) => {
  overlay?.removeChildren();
};

export const createHealthBar = (hp: number, maxHp: number) => {
  const container = new PIXI.Container();
  container.zIndex = 2;

  const bg = new PIXI.Graphics();
  bg.beginFill(0x333333);
  bg.drawRect(0, 0, 50, 8);
  bg.endFill();
  container.addChild(bg);

  const fill = new PIXI.Graphics();
  const ratio = hp / maxHp;
  const color = ratio > 0.5 ? 0x00ff00 : ratio > 0.25 ? 0xffff00 : 0xff0000;
  fill.beginFill(color);
  fill.drawRect(0, 0, 50 * ratio, 8);
  fill.endFill();
  container.addChild(fill);

  const text = new PIXI.Text(`${hp}/${maxHp}`, {
    fontFamily: 'Literata',
    fontSize: 10,
    fill: 0xffffff,
  });
  // center anchor for text (PIXI.Text exposes `anchor`)
  if (text.anchor && typeof text.anchor.set === 'function') {
    text.anchor.set(0.5);
  }
  text.position.set(25, 4);
  container.addChild(text);

  const update = (newHp: number) => {
    const r = newHp / maxHp;
    const c = r > 0.5 ? 0x00ff00 : r > 0.25 ? 0xffff00 : 0xff0000;
    fill.clear();
    fill.beginFill(c);
    fill.drawRect(0, 0, 50 * r, 8);
    fill.endFill();
    // text update depending on bitmap font support
  };

  return {
    container,
    bg,
    fill,
    text,
    update,
  };
};
