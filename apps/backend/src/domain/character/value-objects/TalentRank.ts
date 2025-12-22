/**
 * Value Object representing an unlocked talent rank in a voie.
 * Immutable - all modifications return a new instance.
 */
export class TalentRank {
  public readonly voieId: string;
  public readonly rank: number;

  private static readonly MIN_RANK = 1;
  private static readonly MAX_RANK = 5;

  constructor(voieId: string, rank: number) {
    if (!voieId || voieId.trim() === "") {
      throw new Error("VoieId cannot be empty");
    }
    if (rank < TalentRank.MIN_RANK || rank > TalentRank.MAX_RANK) {
      throw new Error(`Rank must be between ${TalentRank.MIN_RANK} and ${TalentRank.MAX_RANK}`);
    }
    this.voieId = voieId;
    this.rank = rank;
  }

  canUnlockNext(): boolean {
    return this.rank < TalentRank.MAX_RANK;
  }

  unlockNext(): TalentRank {
    if (!this.canUnlockNext()) {
      throw new Error("Already at maximum rank");
    }
    return new TalentRank(this.voieId, this.rank + 1);
  }

  isMaxRank(): boolean {
    return this.rank === TalentRank.MAX_RANK;
  }

  toPlainObject(): { voieId: string; rank: number } {
    return {
      voieId: this.voieId,
      rank: this.rank,
    };
  }

  static createFirst(voieId: string): TalentRank {
    return new TalentRank(voieId, TalentRank.MIN_RANK);
  }
}
