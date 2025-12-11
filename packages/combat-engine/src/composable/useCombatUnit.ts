import { useUnitsStore } from '../stores/units';
import { storeToRefs } from 'pinia';
import { markRaw } from 'vue';
import { AnimatedSprite, BitmapText, Container, Graphics, Texture, Sprite, Assets } from 'pixi.js';

/**
 * Unit service returns a tiny API working on an injected Map<string, UnitData>.
 * Migration plan: move existing createUnit/moveUnitToGrid/updateUnitHealth here.
 */
export const useCombatUnit = () => {
  const unitsStore = useUnitsStore();
  const { units } = storeToRefs(unitsStore);

  const createUnitEntry = (
    unitId: string,
    sprite: AnimatedSprite,
    animations: Record<string, Texture[]>,
    gridX: number,
    gridY: number,
    maxMoveRange: number,
    hp: number,
    maxHp: number,
  ) => {
    const healthBar = createHealthBar(hp, maxHp);

    const entry = markRaw({
      sprite,
      animations,
      gridX,
      gridY,
      maxMoveRange,
      hp,
      maxHp,
      healthBar,
    });

    units.value.set(unitId, entry);

    // Return healthBar so caller can add it to the stage and position it
    return healthBar;
  };
  // HealthBar factory now lives with the unit service
  const createHealthBar = (hp: number, maxHp: number) => {
    const container = new Container();
    container.zIndex = 2;
    const xBarOffset = -25;
    const xHpHeartOffset = -40;
    const bg = new Graphics();
    bg.rect(xBarOffset, 0, 50, 8);
    bg.fill({ color: 0x333333 });
    container.addChild(bg);

    const fill = new Graphics();
    const ratio = Math.max(0, Math.min(1, hp / maxHp));
    const color = ratio > 0.5 ? 0x00ff00 : ratio > 0.25 ? 0xffff00 : 0xff0000;
    fill.rect(xBarOffset, 0, 50 * ratio, 8);
    fill.fill({ color });
    container.addChild(fill);

    const text = new BitmapText({
      text: `${hp}/${maxHp}`,
      style: {
        fontFamily: 'HealthBarFont',
        fontSize: 10,
      },
    });
    text.anchor.set(0.5);
    text.position.set(0, 1);
    container.addChild(text);

    // Add heart icon next to the health bar
    let heartSprite: Sprite | null = null;
    try {
      const heartTexture = Assets.get('heart');
      if (heartTexture instanceof Texture) {
        heartSprite = new Sprite(heartTexture);
        heartSprite.scale.set(0.1);
        heartSprite.position.set(xHpHeartOffset, -2);
        container.addChild(heartSprite);
      }
    } catch {
      console.warn('Heart texture not loaded, skipping heart icon');
    }

    const update = (newHp: number) => {
      const r = Math.max(0, Math.min(1, newHp / maxHp));
      const c = r > 0.5 ? 0x00ff00 : r > 0.25 ? 0xffff00 : 0xff0000;
      fill.clear();
      fill.rect(0, 0, 50 * r, 8);
      fill.fill({ color: c });
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

  const moveUnitState = (unitId: string, toGridX: number, toGridY: number) => {
    const unit = units.value.get(unitId);
    if (!unit) throw new Error(`moveUnitState: unit ${unitId} not found`);
    unit.gridX = toGridX;
    unit.gridY = toGridY;
    return true;
  };

  const updateHp = (unitId: string, newHp: number) => {
    const unit = units.value.get(unitId);
    if (!unit) throw new Error(`updateHp: unit ${unitId} not found`);
    unit.hp = Math.max(0, Math.min(newHp, unit.maxHp));
    if (unit.healthBar?.update) unit.healthBar.update(unit.hp);
    return true;
  };

  return {
    createUnitEntry,
    moveUnitState,
    updateHp,
  };
};
