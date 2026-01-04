import { useUnitsStore } from "../stores/units";
import { storeToRefs } from "pinia";
import { markRaw } from "vue";
import { AnimatedSprite, BitmapText, Container, Graphics, Texture, Sprite, Assets } from "pixi.js";
import { animations } from "../services/spritesAnimations";
import type { UnitData } from "../types/combat-types";
import gsap from "gsap";

/**
 * Unit service returns a tiny API working on an injected Map<string, UnitData>.
 * Migration plan: move existing createUnit/moveUnitToGrid/updateUnitHealth here.
 */
export const useCombatUnit = () => {
  const unitsStore = useUnitsStore();
  const { units } = storeToRefs(unitsStore);
  const greenColor = 0x00ff00;
  const yellowColor = 0xffff00;
  const redColor = 0xff0000;

  const getUnit = (unitId: string): UnitData => {
    const unit = units.value.get(unitId);
    if (!unit) throw new Error(`getUnit: unit ${unitId} not found`);

    return unit as UnitData;
  };

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

    const unitData = markRaw({
      sprite,
      animations,
      gridX,
      gridY,
      maxMoveRange,
      hp,
      maxHp,
      healthBar,
    });

    units.value.set(unitId, unitData as UnitData);
    if (unitData.hp == 0) {
      // Update health bar visual first, then animate death
      healthBar.update(0);
      animateDeath(unitData);
    }

    // Return healthBar so caller can add it to the stage and position it
    return healthBar;
  };

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
    const color = ratio > 0.5 ? greenColor : ratio > 0.25 ? yellowColor : redColor;
    fill.rect(xBarOffset, 0, 50 * ratio, 8);
    fill.fill({ color });
    container.addChild(fill);

    const text = new BitmapText({
      text: `${hp}/${maxHp}`,
      style: {
        fontFamily: "HealthBarFont",
        fontSize: 10,
      },
    });
    text.anchor.set(0.5);
    text.position.set(0, 1);
    container.addChild(text);

    // Add heart icon next to the health bar
    let heartSprite: Sprite | null = null;
    try {
      const heartTexture = Assets.get("heart");
      if (heartTexture instanceof Texture) {
        heartSprite = new Sprite(heartTexture);
        heartSprite.scale.set(0.1);
        heartSprite.position.set(xHpHeartOffset, -2);
        container.addChild(heartSprite);
      }
    } catch {
      console.warn("Heart texture not loaded, skipping heart icon");
    }

    const update = (newHp: number) => {
      const hpPercentage = Math.max(0, Math.min(1, newHp / maxHp));

      const healthStatusColor =
        hpPercentage > 0.5 ? greenColor : hpPercentage > 0.25 ? yellowColor : redColor;
      fill.clear();
      fill.rect(0, 0, 50 * hpPercentage, 8);
      fill.fill({ color: healthStatusColor });
      // BitmapText update depending on font atlas
      text.text = `${newHp}/${maxHp}`;

      // Enhanced visual when HP reaches 0
      if (newHp <= 0) {
        // Pulse effect: flash the health bar red
        fill.clear();
        fill.rect(xBarOffset, 0, 50, 8);
        fill.fill({ color: redColor });
        container.alpha = 0.6; // Dim the health bar to show unit is defeated
      }
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
    const unit = getUnit(unitId);
    unit.gridX = toGridX;
    unit.gridY = toGridY;
    return true;
  };

  const animateDeath = (unit: UnitData) => {
    const deathKey = "death_bottom" as const;
    const deathTextures = unit.animations[deathKey];
    const deathConfig = animations[deathKey];

    if (!deathTextures || !deathConfig) {
      console.error(`Death animation not found for key: ${deathKey}`);
      return;
    }

    // Stop current animation, reset frame, then swap textures
    unit.sprite.stop();
    unit.sprite.currentFrame = 0;
    unit.sprite.textures = deathTextures;
    unit.sprite.animationSpeed = deathConfig.speed;
    unit.sprite.loop = false; // Play death animation only once
    unit.sprite.play();

    // After death animation completes, fade out
    const deathDurationMs = (deathTextures.length / deathConfig.speed) * 1000;

    gsap.to(unit.sprite, {
      alpha: 0,
      scale: 0.9,
      duration: 0.8,
      delay: deathDurationMs / 1000, // Wait for death animation to finish
      ease: "power2.in",
    });
  };

  const updateHp = (unitId: string, newHp: number) => {
    const unit: UnitData = getUnit(unitId);
    if (!units.value.get(unitId)) throw new Error(`updateHp: unit ${unitId} not found`);
    if (unit.healthBar?.update) unit.healthBar.update(newHp);

    if (newHp > 0) return true;

    animateDeath(unit);
  };

  /**
   * Update unit's movement range (PM)
   * Should be called when PM changes (after movement, after end turn)
   */
  const updateMoveRange = (unitId: string, newMaxMoveRange: number) => {
    const unit = units.value.get(unitId);
    if (!unit) throw new Error(`updateMoveRange: unit ${unitId} not found`);
    unit.maxMoveRange = newMaxMoveRange;
  };

  return {
    createUnitEntry,
    moveUnitState,
    updateHp,
    updateMoveRange,
  };
};
