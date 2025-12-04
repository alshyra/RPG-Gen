import { Injectable } from '@nestjs/common';
import { CombatantDto } from '../dto/CombatantDto.js';

@Injectable()
export class TurnOrderService {
  /**
   * Build sorted turn order from player and enemies.
   * Player and enemies are represented by CombatantDto; player entries have isPlayer=true.
   */
  buildTurnOrder(characterId: string, player: CombatantDto, enemies: CombatantDto[]): CombatantDto[] {
    const enemyEntries: CombatantDto[] = enemies.map(e => new CombatantDto({
      id: e.id,
      name: e.name,
      initiative: e.initiative,
      isPlayer: false,
    }));

    const allCombatants: CombatantDto[] = [
      ...enemyEntries,
      new CombatantDto({
        id: characterId,
        name: player.name,
        initiative: player.initiative,
        isPlayer: true,
      }),
    ];

    // Sort by initiative desc, tie-breaker: enemies before player (players get pushed later)
    return allCombatants.sort((a, b) => {
      if (b.initiative !== a.initiative) return b.initiative - a.initiative;
      return a.isPlayer ? 1 : -1;
    });
  }
}
