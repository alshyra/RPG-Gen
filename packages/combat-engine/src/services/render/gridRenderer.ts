import * as PIXI from "pixi.js";
import { GRID_CONFIG } from "../../types/combat-types";

interface HasStage {
  stage: PIXI.Container;
}

// Génère toutes les coordonnées de la grille en une seule fois
const getGridCoordinates = () =>
  Array.from({ length: GRID_CONFIG.cols }, (_, x) =>
    Array.from({ length: GRID_CONFIG.rows }, (_, y) => ({
      x,
      y,
    })),
  ).flat();

/**
 * Convert grid coordinates to isometric pixel coordinates (center of diamond tile)
 * Uses a 2:1 fake isometric projection
 */
export const gridToPixel = (gridX: number, gridY: number): { x: number; y: number } => {
  const { tileWidth, tileHeight, originX, originY } = GRID_CONFIG;
  // Isometric projection:
  // x_screen = (gridX - gridY) * tileWidth/2 + originX
  // y_screen = (gridX + gridY) * tileHeight/2 + originY
  return {
    x: (gridX - gridY) * (tileWidth / 2) + originX,
    y: (gridX + gridY) * (tileHeight / 2) + originY,
  };
};

/**
 * Convert pixel coordinates to grid coordinates (inverse isometric projection)
 * Clamped to valid grid bounds
 */
export const pixelToGrid = (pixelX: number, pixelY: number): { gridX: number; gridY: number } => {
  const { tileWidth, tileHeight, originX, originY, cols, rows } = GRID_CONFIG;

  // Inverse isometric projection:
  // Forward: x = (gridX - gridY) * w/2 + originX, y = (gridX + gridY) * h/2 + originY
  // Inverse: gridX = (x/w + y/h) / 2, gridY = (y/h - x/w) / 2
  const relX = pixelX - originX;
  const relY = pixelY - originY;

  const rawGridX = (relX / (tileWidth / 2) + relY / (tileHeight / 2)) / 2;
  const rawGridY = (relY / (tileHeight / 2) - relX / (tileWidth / 2)) / 2;

  // Clamp to grid bounds
  const gridX = Math.max(0, Math.min(cols - 1, Math.floor(rawGridX + 0.5)));
  const gridY = Math.max(0, Math.min(rows - 1, Math.floor(rawGridY + 0.5)));

  return { gridX, gridY };
};

/**
 * Get the 4 corner points of a diamond tile at grid position (x, y)
 * Returns [top, right, bottom, left] as a fixed tuple
 */
const getDiamondPoints = (
  gridX: number,
  gridY: number,
): [
  { x: number; y: number },
  { x: number; y: number },
  { x: number; y: number },
  { x: number; y: number },
] => {
  const { tileWidth, tileHeight, originX, originY } = GRID_CONFIG;
  const centerX = (gridX - gridY) * (tileWidth / 2) + originX;
  const centerY = (gridX + gridY) * (tileHeight / 2) + originY;

  // Diamond corners: top, right, bottom, left (relative to center)
  return [
    { x: centerX, y: centerY - tileHeight / 2 }, // top
    { x: centerX + tileWidth / 2, y: centerY }, // right
    { x: centerX, y: centerY + tileHeight / 2 }, // bottom
    { x: centerX - tileWidth / 2, y: centerY }, // left
  ];
};

// Crée tous les tiles en une seule passe avec un seul Graphics (diamond tiles)
const createTilesGraphics = (): PIXI.Graphics => {
  const graphics = new PIXI.Graphics();

  getGridCoordinates().forEach(({ x, y }) => {
    const isEven = (x + y) % 2 === 0;
    const color = isEven ? GRID_CONFIG.tileColor1 : GRID_CONFIG.tileColor2;
    const [top, right, bottom, left] = getDiamondPoints(x, y);

    // Draw diamond polygon
    graphics.moveTo(top.x, top.y);
    graphics.lineTo(right.x, right.y);
    graphics.lineTo(bottom.x, bottom.y);
    graphics.lineTo(left.x, left.y);
    graphics.closePath();
    graphics.fill({ color });
  });

  return graphics;
};

// Crée toutes les lignes de la grille en une seule passe (diamond outlines)
const createGridLinesGraphics = (): PIXI.Graphics => {
  const lines = new PIXI.Graphics();
  lines.setStrokeStyle({
    width: 1,
    color: GRID_CONFIG.lineColor,
    alpha: GRID_CONFIG.lineAlpha,
  });

  // Draw outline for each diamond tile
  getGridCoordinates().forEach(({ x, y }) => {
    const [top, right, bottom, left] = getDiamondPoints(x, y);
    lines.moveTo(top.x, top.y);
    lines.lineTo(right.x, right.y);
    lines.lineTo(bottom.x, bottom.y);
    lines.lineTo(left.x, left.y);
    lines.closePath();
  });

  lines.stroke();
  return lines;
};

export const createGrid = (app: HasStage): PIXI.Container | null => {
  if (!app) return null;

  const container = new PIXI.Container();
  container.zIndex = 0;

  // Ajoute les tiles et les lignes (un seul Graphics par type)
  container.addChild(createTilesGraphics());
  container.addChild(createGridLinesGraphics());

  app.stage.addChild(container);
  return container;
};

export const createRangeOverlay = (app: HasStage): PIXI.Container | null => {
  if (!app) return null;

  const overlayContainer = new PIXI.Container();
  overlayContainer.zIndex = 0.5;
  app.stage.addChild(overlayContainer);

  return overlayContainer;
};

export const showReachableCells = (
  overlay: PIXI.Container | null,
  originGridX: number,
  originGridY: number,
  range: number,
): void => {
  if (!overlay) return;

  overlay.removeChildren();

  // Crée un seul Graphics pour toutes les cellules accessibles (diamond tiles)
  const graphics = new PIXI.Graphics();

  getGridCoordinates()
    .filter(({ x, y }) => {
      const dist = Math.abs(x - originGridX) + Math.abs(y - originGridY);
      return dist > 0 && dist <= range;
    })
    .forEach(({ x, y }) => {
      const points = getDiamondPoints(x, y);
      const [top, right, bottom, left] = points;
      graphics.moveTo(top.x, top.y);
      graphics.lineTo(right.x, right.y);
      graphics.lineTo(bottom.x, bottom.y);
      graphics.lineTo(left.x, left.y);
      graphics.closePath();
    });

  // Fill AFTER drawing all diamonds to apply color to all cells
  graphics.fill({
    color: GRID_CONFIG.reachableColor,
    alpha: GRID_CONFIG.reachableAlpha,
  });

  overlay.addChild(graphics);
};

export const hideReachableCells = (overlay: PIXI.Container | null): void => {
  overlay?.removeChildren();
};

/**
 * Show a preview of the path that would be taken to reach a destination
 * Displays in a different color (cyan) to differentiate from reachable cells
 */
export const showPathPreview = (
  overlay: PIXI.Container | null,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): void => {
  if (!overlay) return;

  // Don't show path to starting position
  if (startX === endX && startY === endY) return;

  const path = findManhattanPath(startX, startY, endX, endY);
  if (path.length === 0) return;

  // Create graphics for path preview
  const graphics = new PIXI.Graphics();

  path.forEach(({ gridX, gridY }) => {
    const points = getDiamondPoints(gridX, gridY);
    const [top, right, bottom, left] = points;
    graphics.moveTo(top.x, top.y);
    graphics.lineTo(right.x, right.y);
    graphics.lineTo(bottom.x, bottom.y);
    graphics.lineTo(left.x, left.y);
    graphics.closePath();
  });

  // Cyan color with higher alpha for path preview
  graphics.fill({
    color: 0x00ffff,
    alpha: 0.6,
  });

  overlay.addChild(graphics);
};

/**
 * Find a path from (startX, startY) to (endX, endY) using Manhattan movement (no diagonals).
 * Returns an array of waypoints including the destination but NOT the starting position.
 * Path moves horizontally first, then vertically.
 */
export const findManhattanPath = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): { gridX: number; gridY: number }[] => {
  const path: { gridX: number; gridY: number }[] = [];

  let currentX = startX;
  let currentY = startY;

  // Move horizontally first (X axis)
  const stepX = endX > currentX ? 1 : -1;
  while (currentX !== endX) {
    currentX += stepX;
    path.push({ gridX: currentX, gridY: currentY });
  }

  // Then move vertically (Y axis)
  const stepY = endY > currentY ? 1 : -1;
  while (currentY !== endY) {
    currentY += stepY;
    path.push({ gridX: currentX, gridY: currentY });
  }

  return path;
};
