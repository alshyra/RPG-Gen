// bounded-contexts/archetype/domain/value-objects/TalentRank.ts

/**
 * Value Object représentant un rang dans une voie de talents
 * 
 * @immutable
 * @description
 * Un rang = 1 aptitude débloquable moyennant X points de talent
 */
export interface TalentRankProps {
  rank: number;           // 1-5
  aptitudeId: string;     // ID de l'aptitude
  pointCost: number;      // Coût en points de talent
}

export class TalentRank {
  private readonly _rank: number;
  private readonly _aptitudeId: string;
  private readonly _pointCost: number;

  constructor(props: TalentRankProps) {
    if (props.rank < 1 || props.rank > 5) {
      throw new Error('Rank must be between 1 and 5');
    }
    if (props.pointCost < 0) {
      throw new Error('Point cost cannot be negative');
    }

    this._rank = props.rank;
    this._aptitudeId = props.aptitudeId;
    this._pointCost = props.pointCost;
  }

  get rank(): number { return this._rank; }
  get aptitudeId(): string { return this._aptitudeId; }
  get pointCost(): number { return this._pointCost; }

  equals(other: TalentRank): boolean {
    return (
      this._rank === other._rank &&
      this._aptitudeId === other._aptitudeId &&
      this._pointCost === other._pointCost
    );
  }

  toJSON() {
    return {
      rank: this._rank,
      aptitudeId: this._aptitudeId,
      pointCost: this._pointCost,
    };
  }
}