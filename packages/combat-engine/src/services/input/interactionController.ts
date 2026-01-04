import type * as PIXI from "pixi.js";
import type { UnitData } from "../../types/combat-types";

export const setupInteractionController = (
  app: PIXI.Application,
  getUnits: () => Map<string, UnitData>,
  helpers: {
    pixelToGrid: (x: number, y: number) => { gridX: number; gridY: number };
    gridToPixel: (gridX: number, gridY: number) => { x: number; y: number };
    showReachableCells: (gx: number, gy: number, r: number) => void;
    hideReachableCells: () => void;
    showPathPreview: (sx: number, sy: number, ex: number, ey: number) => void;
    moveUnitToGrid: (id: string, x: number, y: number) => Promise<void>;
    highlightUnit: (id: string | null) => void;
  },
) => {
  // State: selected unit (null = no selection)
  let selectedUnitId: string | null = null;
  let lastHoverGridX = -1;
  let lastHoverGridY = -1;

  /**
   * Handle mouse movement over the stage to show path preview
   */
  const onStageMove = (ev: PIXI.FederatedPointerEvent) => {
    if (!selectedUnitId) return;

    const unit = getUnits().get(selectedUnitId);
    if (!unit) return;

    const { gridX, gridY } = helpers.pixelToGrid(ev.global.x, ev.global.y);

    // Only update if grid position changed
    if (gridX === lastHoverGridX && gridY === lastHoverGridY) return;
    lastHoverGridX = gridX;
    lastHoverGridY = gridY;

    // Validate Manhattan distance
    const distance = Math.abs(gridX - unit.gridX) + Math.abs(gridY - unit.gridY);

    // Clear and redraw: show reachable cells + path preview if valid
    helpers.hideReachableCells();
    console.log('onStageMove', unit)
    helpers.showReachableCells(unit.gridX, unit.gridY, unit.maxMoveRange);

    if (distance > 0 && distance <= unit.maxMoveRange) {
      helpers.showPathPreview(unit.gridX, unit.gridY, gridX, gridY);
    }
  };

  /**
   * Handle click on a tile (not on a unit sprite)
   * If a unit is selected, attempt to move to that tile
   */
  const onStageClick = (ev: PIXI.FederatedPointerEvent) => {
    // Ignore if target is not the stage itself (i.e., clicked on a sprite)
    // We check if target === stage to detect background clicks
    if (ev.target !== app.stage) return;

    if (!selectedUnitId) return;

    const unit = getUnits().get(selectedUnitId);
    if (!unit) {
      clearSelection();
      return;
    }

    const { gridX, gridY } = helpers.pixelToGrid(ev.global.x, ev.global.y);

    // Validate Manhattan distance
    const distance = Math.abs(gridX - unit.gridX) + Math.abs(gridY - unit.gridY);
    if (distance === 0 || distance > unit.maxMoveRange) {
      // Invalid move - just clear selection
      clearSelection();
      return;
    }

    // Valid move - execute movement then clear selection
    const unitToMove = selectedUnitId;
    clearSelection();
    void helpers.moveUnitToGrid(unitToMove, gridX, gridY);
  };

  /**
   * Clear current selection
   */
  const clearSelection = () => {
    helpers.hideReachableCells();
    helpers.highlightUnit(null);
    selectedUnitId = null;
    lastHoverGridX = -1;
    lastHoverGridY = -1;
  };

  /**
   * Select a unit and show reachable cells
   */
  const selectUnit = (id: string) => {
    const unit = getUnits().get(id);
    if (!unit) {
      console.error(`[interactionController] selectUnit called but unit ${id} not found`);
      return;
    }

    // If clicking on already selected unit, deselect
    if (selectedUnitId === id) {
      clearSelection();
      return;
    }

    // Clear previous selection first
    if (selectedUnitId) {
      clearSelection();
    }

    selectedUnitId = id;
    helpers.highlightUnit(id);
    helpers.showReachableCells(unit.gridX, unit.gridY, unit.maxMoveRange);
    console.info(
      `[interactionController] Unit ${id} selected at grid (${unit.gridX}, ${unit.gridY})`,
    );
  };

  // Listen for mouse movement to show path preview
  app.stage.on("pointermove", onStageMove);
  // Listen for clicks on stage (background) for destination selection
  app.stage.on("pointerdown", onStageClick);

  return {
    selectUnit,
    clearSelection,
    getSelectedUnit: () => selectedUnitId,
  };
};
