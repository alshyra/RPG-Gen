// packages/frontend/src/adapters/combatAdapter.ts
import type { CombatStateDto } from "@rpg-gen/shared";
import type { UnitConfig, CombatConfig, GridPosition } from "@rpg-gen/combat-engine";

export class CombatAdapter {
  /**
   * Convertit l'état backend en config pour le moteur visuel
   */
  static toCombatConfig(state: CombatStateDto): CombatConfig {
    const units: UnitConfig[] = [
      // Player
      {
        id: state.player.id,
        characterKey: "Archer-Green", // Player default sprite
        position: this.getInitialPosition("player", state),
        stats: {
          hp: state.player.hp ?? 0,
          maxHp: state.player.hpMax ?? 0,
          ac: state.player.ac ?? 10,
          attack: 0, // À calculer depuis character
          defense: 0,
          moveRange: 3,
          attackRange: 1,
          // Tactical system resources
          pa: state.player.pa,
          paMax: state.player.paMax,
          pm: state.player.pm,
          pmMax: state.player.pmMax,
        },
        team: "player",
        isPlayer: true,
      },
      // Enemies
      ...state.enemies.map(
        (enemy, idx): UnitConfig => ({
          id: enemy.id,
          characterKey: this.mapEnemyToSprite(enemy.name),
          position: this.getInitialPosition("enemy", state, idx),
          stats: {
            hp: enemy.hp ?? 0,
            maxHp: enemy.hpMax ?? 0,
            ac: enemy.ac ?? 10,
            attack: enemy.attackBonus ?? 0,
            defense: 0,
            moveRange: 2,
            attackRange: 1,
            // Tactical system resources
            pa: enemy.pa,
            paMax: enemy.paMax,
            pm: enemy.pm,
            pmMax: enemy.pmMax,
          },
          team: "enemy",
          isPlayer: false,
        }),
      ),
    ];

    return {
      gridSize: {
        cols: 12,
        rows: 9,
        cellSize: 64,
      },
      units,
      turnBased: true,
    };
  }

  /**
   * Position initiale basée sur l'ordre de tour
   */
  private static getInitialPosition(
    team: "player" | "enemy",
    _state: CombatStateDto,
    index = 0,
  ): GridPosition {
    if (team === "player") {
      return {
        gridX: 2,
        gridY: 4,
      }; // Gauche centre
    }
    // Ennemis à droite, espacés verticalement
    return {
      gridX: 9,
      gridY: 3 + index * 2, // 3, 5, 7...
    };
  }

  /**
   * Mapping nom ennemi → sprite key
   */
  private static mapEnemyToSprite(name: string): string {
    const mapping: Record<string, string> = {
      Goblin: "Warrior-Red",
      Orc: "Warrior-Blue",
      Skeleton: "Mage-Cyan",
    };
    return mapping[name] ?? "Soldier-Red";
  }
}
