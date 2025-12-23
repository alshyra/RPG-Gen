import { TalentRank } from './TalentRank.js';

/**
 * Value Object représentant une voie de talents (1 des 3 arbres d'une classe)
 * 
 * @immutable
 * @description
 * Une voie = 5 rangs, chaque rang débloque 1+ aptitudes
 */
export interface TalentTreeProps {
  voieId: string;          // 'guerrier_force', 'mage_destruction'
  name: string;            // 'Voie de la Force'
  description?: string;
  ranks: TalentRank[];     // 5 rangs
}

export class TalentTree {
  private readonly _voieId: string;
  private readonly _name: string;
  private readonly _description?: string;
  private readonly _ranks: TalentRank[];

  constructor(props: TalentTreeProps) {
    if (props.ranks.length !== 5) {
      throw new Error('Talent tree must have exactly 5 ranks');
    }

    // Vérifier que les rangs sont dans l'ordre 1-5
    const sortedRanks = [...props.ranks].sort((a, b) => a.rank - b.rank);
    for (let i = 0; i < 5; i++) {
      if (sortedRanks[i].rank !== i + 1) {
        throw new Error(`Missing or duplicate rank: expected ${i + 1}`);
      }
    }

    this._voieId = props.voieId;
    this._name = props.name;
    this._description = props.description;
    this._ranks = sortedRanks;
  }

  get voieId(): string { return this._voieId; }
  get name(): string { return this._name; }
  get description(): string | undefined { return this._description; }
  get ranks(): readonly TalentRank[] { return this._ranks; }

  // ✅ Logique métier
  getRankData(rank: number): TalentRank | null {
    return this._ranks.find(r => r.rank === rank) || null;
  }

  getAptitudeIdAtRank(rank: number): string | null {
    const rankData = this.getRankData(rank);
    return rankData ? rankData.aptitudeId : null;
  }

  getAllAptitudeIds(): string[] {
    return this._ranks.map(r => r.aptitudeId);
  }

  getRankOfAptitude(aptitudeId: string): number | null {
    const rank = this._ranks.find(r => r.aptitudeId === aptitudeId);
    return rank ? rank.rank : null;
  }

  getCostToUnlockRank(rank: number): number {
    const rankData = this.getRankData(rank);
    return rankData ? rankData.pointCost : 0;
  }

  canUnlockRank(rank: number, currentRank: number): boolean {
    // Pour débloquer rank N, il faut avoir débloqué rank N-1
    if (rank === 1) return true;
    return currentRank >= rank - 1;
  }

  equals(other: TalentTree): boolean {
    return (
      this._voieId === other._voieId &&
      this._name === other._name &&
      this._ranks.length === other._ranks.length &&
      this._ranks.every((rank, i) => rank.equals(other._ranks[i]))
    );
  }

  toJSON() {
    return {
      voieId: this._voieId,
      name: this._name,
      description: this._description,
      ranks: this._ranks.map(r => r.toJSON()),
    };
  }
}