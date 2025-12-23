import { TalentRank } from './TalentRank.js';

/**
 * Value Object representing a talent tree (voie) within a class
 * 
 * @domain game-data
 * Pure TypeScript - no framework dependencies
 */
export class TalentTree {
  readonly voieId: string;
  readonly name: string;
  readonly description: string;
  readonly ranks: ReadonlyArray<TalentRank>;

  constructor(props: {
    voieId: string;
    name: string;
    description?: string;
    ranks: Array<{ rank: number; aptitudeId: string; pointCost: number }>;
  }) {
    if (!props.voieId) {
      throw new Error('Voie ID is required');
    }
    if (!props.name) {
      throw new Error('Talent tree name is required');
    }
    if (!props.ranks || props.ranks.length === 0) {
      throw new Error('Talent tree must have at least one rank');
    }

    this.voieId = props.voieId;
    this.name = props.name;
    this.description = props.description ?? '';
    this.ranks = props.ranks.map(r => new TalentRank(r));
  }

  /**
   * Get aptitude ID for a specific rank
   */
  getAptitudeAtRank(rank: number): string | undefined {
    const talentRank = this.ranks.find(r => r.rank === rank);
    return talentRank?.aptitudeId;
  }

  /**
   * Get total point cost to unlock all ranks up to and including the given rank
   */
  getTotalCostUpToRank(rank: number): number {
    return this.ranks
      .filter(r => r.rank <= rank)
      .reduce((sum, r) => sum + r.pointCost, 0);
  }

  /**
   * Get all aptitude IDs in this tree
   */
  getAllAptitudeIds(): string[] {
    return this.ranks.map(r => r.aptitudeId);
  }

  equals(other: TalentTree): boolean {
    if (this.voieId !== other.voieId) return false;
    if (this.name !== other.name) return false;
    if (this.ranks.length !== other.ranks.length) return false;
    return this.ranks.every((r, i) => r.equals(other.ranks[i]));
  }
}
