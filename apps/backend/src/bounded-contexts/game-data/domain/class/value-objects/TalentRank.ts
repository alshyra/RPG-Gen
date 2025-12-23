/**
 * Value Object representing a single rank in a talent tree
 * 
 * @domain game-data
 * Pure TypeScript - no framework dependencies
 */
export class TalentRank {
  readonly rank: number;
  readonly aptitudeId: string;
  readonly pointCost: number;

  constructor(props: { rank: number; aptitudeId: string; pointCost: number }) {
    if (props.rank < 1 || props.rank > 5) {
      throw new Error(`Invalid rank ${props.rank}. Must be between 1 and 5.`);
    }
    if (props.pointCost < 0) {
      throw new Error('Point cost cannot be negative');
    }
    if (!props.aptitudeId) {
      throw new Error('Aptitude ID is required');
    }

    this.rank = props.rank;
    this.aptitudeId = props.aptitudeId;
    this.pointCost = props.pointCost;
  }

  equals(other: TalentRank): boolean {
    return (
      this.rank === other.rank &&
      this.aptitudeId === other.aptitudeId &&
      this.pointCost === other.pointCost
    );
  }
}
