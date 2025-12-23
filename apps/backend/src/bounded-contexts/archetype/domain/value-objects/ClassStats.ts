/**
 * Value Object pour les statistiques de base d'une classe
 */
export interface ArchetypeStatsProps {
  hpBase: number;
  hpGain: number;
  pa: number;
  pm: number;
}

export class ClassStats {
  private readonly _hpBase: number;
  private readonly _hpGain: number;
  private readonly _pa: number;
  private readonly _pm: number;

  constructor(props: ArchetypeStatsProps) {
    if (props.hpBase <= 0 || props.hpGain <= 0) {
      throw new Error('HP values must be positive');
    }
    if (props.pa <= 0 || props.pm <= 0) {
      throw new Error('PA/PM values must be positive');
    }

    this._hpBase = props.hpBase;
    this._hpGain = props.hpGain;
    this._pa = props.pa;
    this._pm = props.pm;
  }

  get hpBase(): number { return this._hpBase; }
  get hpGain(): number { return this._hpGain; }
  get pa(): number { return this._pa; }
  get pm(): number { return this._pm; }

  calculateHpAtLevel(level: number, vigorBonus: number = 0): number {
    return this._hpBase + (level - 1) * this._hpGain + vigorBonus;
  }

  equals(other: ClassStats): boolean {
    return (
      this._hpBase === other._hpBase &&
      this._hpGain === other._hpGain &&
      this._pa === other._pa &&
      this._pm === other._pm
    );
  }

  toJSON() {
    return {
      hpBase: this._hpBase,
      hpGain: this._hpGain,
      pa: this._pa,
      pm: this._pm,
    };
  }
}
