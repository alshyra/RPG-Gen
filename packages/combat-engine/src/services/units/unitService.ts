import * as PIXI from 'pixi.js';
import type { UnitData } from '@/types/combat-types';

/**
 * Unit service returns a tiny API working on an injected Map<string, UnitData>.
 * Migration plan: move existing createUnit/moveUnitToGrid/updateUnitHealth here.
 */
export const createUnitService = (unitsMap: Map<string, UnitData>) => {
  // HealthBar factory now lives with the unit service
  const createHealthBar = (hp: number, maxHp: number) => {
    const container = new PIXI.Container();
    container.zIndex = 2;

    const bg = new PIXI.Graphics();
    bg.beginFill(0x333333);
    bg.drawRect(0, 0, 50, 8);
    bg.endFill();
    container.addChild(bg);

    const fill = new PIXI.Graphics();
    const ratio = Math.max(0, Math.min(1, hp / maxHp));
    const color = ratio > 0.5 ? 0x00ff00 : ratio > 0.25 ? 0xffff00 : 0xff0000;
    fill.beginFill(color);
    fill.drawRect(0, 0, 50 * ratio, 8);
    fill.endFill();
    container.addChild(fill);

    const text = new PIXI.BitmapText(`${hp}/${maxHp}`, {
      fontName: 'HealthBarFont',
      fontSize: 10,
    } as any);
    text.anchor.set(0.5);
    text.position.set(25, 4);
    container.addChild(text);

    const update = (newHp: number) => {
      const r = Math.max(0, Math.min(1, newHp / maxHp));
      const c = r > 0.5 ? 0x00ff00 : r > 0.25 ? 0xffff00 : 0xff0000;
      fill.clear();
      fill.beginFill(c);
      fill.drawRect(0, 0, 50 * r, 8);
      fill.endFill();
      // text.text = `${newHp}/${maxHp}`; // BitmapText update depending on font atlas
    };

    return {
      container,
      bg,
      fill,
      text,
      update,
    };
  };

  const createUnitEntry = (
    unitId: string,
    sprite: PIXI.AnimatedSprite,
    animations: Record<string, PIXI.Texture[]>,
    gridX: number,
    gridY: number,
    maxMoveRange: number,
    hp: number,
    maxHp: number,
  ) => {
    const healthBar = createHealthBar(hp, maxHp);

    unitsMap.set(unitId, {
      sprite,
      animations,
      gridX,
      gridY,
      maxMoveRange,
      hp,
      maxHp,
      healthBar,
    });

    // Return healthBar so caller can add it to the stage and position it
    return healthBar;
  };

  const moveUnitState = (unitId: string, toGridX: number, toGridY: number) => {
    const u = unitsMap.get(unitId);
    if (!u) return false;
    u.gridX = toGridX;
    u.gridY = toGridY;
    return true;
  };

  const updateHp = (unitId: string, newHp: number) => {
    const u = unitsMap.get(unitId);
    if (!u) return false;
    u.hp = Math.max(0, Math.min(newHp, u.maxHp));
    if (u.healthBar?.update) u.healthBar.update(u.hp);
    return true;
  };

  return {
    createUnitEntry,
    moveUnitState,
    updateHp,
  };
};
