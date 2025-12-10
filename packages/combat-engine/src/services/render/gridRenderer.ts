import * as PIXI from 'pixi.js';
import { GRID_CONFIG } from '@/types/combat-types';

interface HasStage { stage: PIXI.Container }

// Génère toutes les coordonnées de la grille en une seule fois
const getGridCoordinates = () => Array.from({ length: GRID_CONFIG.cols }, (_, x) => Array.from({ length: GRID_CONFIG.rows }, (_, y) => ({
  x,
  y,
})))
  .flat();

// Crée tous les tiles en une seule passe avec un seul Graphics
const createTilesGraphics = (): PIXI.Graphics => {
  const graphics = new PIXI.Graphics();

  getGridCoordinates()
    .forEach(({
      x, y,
    }) => {
      const isEven = (x + y) % 2 === 0;
      const color = isEven ? GRID_CONFIG.tileColor1 : GRID_CONFIG.tileColor2;
      graphics.fill(color);
      graphics.rect(
        x * GRID_CONFIG.cellSize,
        y * GRID_CONFIG.cellSize,
        GRID_CONFIG.cellSize,
        GRID_CONFIG.cellSize,
      );
    });

  return graphics;
};

// Crée toutes les lignes de la grille en une seule passe
const createGridLinesGraphics = (): PIXI.Graphics => {
  const lines = new PIXI.Graphics();
  lines.setStrokeStyle({
    width: 1,
    color: GRID_CONFIG.lineColor,
    alpha: GRID_CONFIG.lineAlpha,
  });

  // Lignes verticales
  Array.from({ length: GRID_CONFIG.cols + 1 })
    .forEach((_, i) => {
      const x = i * GRID_CONFIG.cellSize;
      lines.moveTo(x, 0);
      lines.lineTo(x, GRID_CONFIG.rows * GRID_CONFIG.cellSize);
    });

  // Lignes horizontales
  Array.from({ length: GRID_CONFIG.rows + 1 })
    .forEach((_, i) => {
      const y = i * GRID_CONFIG.cellSize;
      lines.moveTo(0, y);
      lines.lineTo(GRID_CONFIG.cols * GRID_CONFIG.cellSize, y);
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

  // Crée un seul Graphics pour toutes les cellules accessibles
  const graphics = new PIXI.Graphics();
  graphics.fill({
    color: GRID_CONFIG.reachableColor,
    alpha: GRID_CONFIG.reachableAlpha,
  });

  getGridCoordinates()
    .filter(({
      x, y,
    }) => {
      const dist = Math.abs(x - originGridX) + Math.abs(y - originGridY);
      return dist > 0 && dist <= range;
    })
    .forEach(({
      x, y,
    }) => {
      graphics.rect(
        x * GRID_CONFIG.cellSize,
        y * GRID_CONFIG.cellSize,
        GRID_CONFIG.cellSize,
        GRID_CONFIG.cellSize,
      );
    });

  overlay.addChild(graphics);
};

export const hideReachableCells = (overlay: PIXI.Container | null): void => {
  overlay?.removeChildren();
};
