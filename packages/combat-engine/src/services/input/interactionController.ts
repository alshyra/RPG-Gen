import type * as PIXI from 'pixi.js';
import type { UnitData } from '../../types/combat-types';

export const setupInteractionController = (
  app: PIXI.Application,
  getUnits: () => Map<string, UnitData>,
  helpers: {
    pixelToGrid: (x: number, y: number) => { gridX: number; gridY: number };
    showReachableCells: (gx: number, gy: number, r: number) => void;
    hideReachableCells: () => void;
    moveUnitToGrid: (id: string, x: number, y: number) => void;
  },
) => {
  let isDragging = false;
  let dragTarget: string | null = null;

  const onPointerMove = (ev: PIXI.FederatedPointerEvent) => {
    if (!isDragging || !dragTarget) return;
    const u = getUnits().get(dragTarget);
    if (!u) return;
    u.sprite.position.copyFrom(ev.global);
    u.healthBar.container.position.set(ev.global.x, ev.global.y - 40);
  };

  const onPointerUp = (ev: PIXI.FederatedPointerEvent) => {
    if (!isDragging || !dragTarget) return;
    const u = getUnits().get(dragTarget);
    if (!u) return;
    const { gridX, gridY } = helpers.pixelToGrid(ev.global.x, ev.global.y);
    const dist = Math.abs(gridX - u.gridX) + Math.abs(gridY - u.gridY);
    if (dist <= u.maxMoveRange) helpers.moveUnitToGrid(dragTarget, gridX, gridY);
    else {
      // caller can animate revert if desired
    }
    helpers.hideReachableCells();
    isDragging = false;
    dragTarget = null;
  };

  app.stage.on('pointermove', onPointerMove);
  app.stage.on('pointerup', onPointerUp);
  app.stage.on('pointerupoutside', onPointerUp);

  return {
    startDrag: (id: string) => {
      isDragging = true;
      dragTarget = id;
      const u = getUnits().get(id);
      if (u) helpers.showReachableCells(u.gridX, u.gridY, u.maxMoveRange);
    },
    stop: () => {
      isDragging = false;
      dragTarget = null;
    },
  };
};
