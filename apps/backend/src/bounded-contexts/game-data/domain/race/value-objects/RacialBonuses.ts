/**
 * Value Object representing stat bonuses from a race
 * 
 * @domain game-data
 * Pure TypeScript - no framework dependencies
 */
export class RacialBonuses {
  readonly vigor: number;
  readonly finesse: number;
  readonly mind: number;
  readonly survival: number;

  constructor(props: {
    vigor?: number;
    finesse?: number;
    mind?: number;
    survival?: number;
    '*'?: number; // Universal bonus (applies to all stats)
  }) {
    const universal = props['*'] ?? 0;
    this.vigor = (props.vigor ?? 0) + universal;
    this.finesse = (props.finesse ?? 0) + universal;
    this.mind = (props.mind ?? 0) + universal;
    this.survival = (props.survival ?? 0) + universal;
  }

  /**
   * Check if any bonuses are applied
   */
  hasAnyBonus(): boolean {
    return this.vigor > 0 || this.finesse > 0 || this.mind > 0 || this.survival > 0;
  }

  /**
   * Get total bonus points
   */
  getTotalBonus(): number {
    return this.vigor + this.finesse + this.mind + this.survival;
  }

  equals(other: RacialBonuses): boolean {
    return (
      this.vigor === other.vigor &&
      this.finesse === other.finesse &&
      this.mind === other.mind &&
      this.survival === other.survival
    );
  }
}
