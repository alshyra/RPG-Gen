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
        position: this.getPosition(state.player.position, "player", 0),
        stats: {
          hp: state.player.hp ?? 0,
          maxHp: state.player.hpMax ?? 0,
          attack: (state.player.basePower ?? 0) + (state.player.level ?? 1),
          defense: 0,
          moveRange: state.player.pm ?? 3,
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
          position: this.getPosition(enemy.position, "enemy", idx),
          stats: {
            hp: enemy.hp ?? 0,
            maxHp: enemy.hpMax ?? 0,
            attack: (enemy.basePower ?? 0) + (enemy.level ?? 1),
            defense: 0,
            moveRange: enemy.pm ?? 2,
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
   * Get position from backend or use default based on team
   */
  private static getPosition(
    backendPosition: { x: number; y: number } | undefined,
    team: "player" | "enemy",
    index: number,
  ): GridPosition {
    // Use backend position if available
    if (backendPosition) {
      return {
        gridX: backendPosition.x,
        gridY: backendPosition.y,
      };
    }
    // Fallback to default positions
    return this.getDefaultPosition(team, index);
  }

  /**
   * Default position when backend doesn't provide one
   */
  private static getDefaultPosition(team: "player" | "enemy", index: number): GridPosition {
    if (team === "player") {
      return {
        gridX: 2,
        gridY: 5,
      }; // Left center (matches backend GRID_HEIGHT/2)
    }
    // Enemies on right, spaced vertically
    return {
      gridX: 12, // GRID_WIDTH - 3 = 12 with backend default
      gridY: Math.max(1, Math.min(8, 5 - Math.floor(3 / 2) + index)),
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
