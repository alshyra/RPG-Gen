import { Injectable } from '@nestjs/common';
import type { CombatStartRequestDto } from '../dto/CombatStartRequestDto.js';
import { CombatantDto } from '../dto/CombatantDto.js';

@Injectable()
export class InitService {
  /**
   * Local d20 roll for initiatives.
   */
  private rollD20(): number {
    return Math.floor(Math.random() * 20) + 1;
  }

  /**
   * Create enemy CombatantDto objects with rolled initiatives.
   */
  buildEnemies(combatStart: CombatStartRequestDto): CombatantDto[] {
    return combatStart.combat_start.map((enemy, idx) => {
      const initRoll = this.rollD20();
      return new CombatantDto({
        id: `enemy-${idx + 1}`,
        isPlayer: false,
        name: enemy.name,
        hp: enemy.hp,
        hpMax: enemy.hp,
        ac: enemy.ac,
        initiative: initRoll,
        attackBonus: enemy.attack_bonus ?? 3,
        damageDice: enemy.damage_dice ?? '1d6',
        damageBonus: enemy.damage_bonus ?? 1,
      });
    });
  }
}
