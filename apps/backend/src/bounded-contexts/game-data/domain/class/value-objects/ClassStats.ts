/**
 * Value Object representing base stats for a character class
 * 
 * @domain game-data
 * Pure TypeScript - no framework dependencies
 */
export class ClassStats {
  readonly hpBase: number;
  readonly hpGain: number;
  readonly pa: number;
  readonly pm: number;

  constructor(props: { hpBase: number; hpGain?: number; pa: number; pm: number }) {
    if (props.hpBase < 1) {
      throw new Error('Base HP must be at least 1');
    }
    if (props.pa < 1) {
      throw new Error('PA must be at least 1');
    }
    if (props.pm < 0) {
      throw new Error('PM cannot be negative');
    }

    this.hpBase = props.hpBase;
    this.hpGain = props.hpGain ?? 0;
    this.pa = props.pa;
    this.pm = props.pm;
  }

  /**
   * Calculate HP at a given level
   */
  calculateHpAtLevel(level: number): number {
    return this.hpBase + (level - 1) * this.hpGain;
  }

  equals(other: ClassStats): boolean {
    return (
      this.hpBase === other.hpBase &&
      this.hpGain === other.hpGain &&
      this.pa === other.pa &&
      this.pm === other.pm
    );
  }
}
