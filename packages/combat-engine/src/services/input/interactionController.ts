import type * as PIXI from 'pixi.js';
import type { UnitData } from '../../types/combat-types';

export const setupInteractionController = (
  app: PIXI.Application,
  getUnits: () => Map<string, UnitData>,
  helpers: {
    pixelToGrid: (x: number, y: number) => { gridX: number; gridY: number };
    gridToPixel: (gridX: number, gridY: number) => { x: number; y: number };
    showReachableCells: (gx: number, gy: number, r: number) => void;
    hideReachableCells: () => void;
    moveUnitToGrid: (id: string, x: number, y: number) => void;
  },
) => {
  let isDragging = false;
  let dragTarget: string | null = null;
  let lastGridX = -1;
  let lastGridY = -1;

  const onPointerMove = (ev: PIXI.FederatedPointerEvent) => {
    if (!isDragging || !dragTarget) return;
    const unit = getUnits().get(dragTarget);
    if (!unit) {
      console.warn(`[interactionController] Unit ${dragTarget} not found during drag`);
      return;
    }
    // Snap to grid: convert pixel to grid, then back to pixel (center of cell)
    const { gridX, gridY } = helpers.pixelToGrid(ev.global.x, ev.global.y);

    // OPTIMIZATION: Only update position if grid cell changed
    if (gridX === lastGridX && gridY === lastGridY) return;
    lastGridX = gridX;
    lastGridY = gridY;

    const snappedPixel = helpers.gridToPixel(gridX, gridY);
    unit.sprite.position.set(snappedPixel.x, snappedPixel.y);
    unit.healthBar.container.position.set(snappedPixel.x, snappedPixel.y - 40);
  };

  const onPointerUp = (ev: PIXI.FederatedPointerEvent) => {
    if (!isDragging || !dragTarget) return;
    const unit = getUnits().get(dragTarget);
    if (!unit) return;

    const { gridX, gridY } = helpers.pixelToGrid(ev.global.x, ev.global.y);
    // Always call moveUnitToGrid - it handles validation and revert internally
    helpers.moveUnitToGrid(dragTarget, gridX, gridY);

    helpers.hideReachableCells();
    isDragging = false;
    dragTarget = null;
    lastGridX = -1;
    lastGridY = -1;
  };

  app.stage.on('pointermove', onPointerMove);
  app.stage.on('pointerup', onPointerUp);
  app.stage.on('pointerupoutside', onPointerUp);

  return {
    startDrag: (id: string) => {
      const unit = getUnits().get(id);
      if (!unit) {
        console.error(`[interactionController] startDrag called but unit ${id} not found in store`);
        return;
      }
      isDragging = true;
      dragTarget = id;
      console.info(
        `[interactionController] drag started for ${id} at grid (${unit.gridX}, ${unit.gridY})`,
      );
      helpers.showReachableCells(unit.gridX, unit.gridY, unit.maxMoveRange);
    },
    stop: () => {
      isDragging = false;
      dragTarget = null;
    },
  };
};
