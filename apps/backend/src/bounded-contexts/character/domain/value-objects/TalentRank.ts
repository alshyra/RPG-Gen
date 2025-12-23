/**
 * Value Object representing an unlocked talent rank in a voie.
 * Immutable - all modifications return a new instance.
 */
export class TalentProgress {
  public readonly voieId: string;
  public readonly rank: number;

  private static readonly MIN_RANK = 1;
  private static readonly MAX_RANK = 5;

  constructor(voieId: string, rank: number) {
    if (!voieId || voieId.trim() === "") {
      throw new Error("VoieId cannot be empty");
    }
    if (rank < TalentProgress.MIN_RANK || rank > TalentProgress.MAX_RANK) {
      throw new Error(`Rank must be between ${TalentProgress.MIN_RANK} and ${TalentProgress.MAX_RANK}`);
    }
    this.voieId = voieId;
    this.rank = rank;
  }

  canUnlockNext(): boolean {
    return this.rank < TalentProgress.MAX_RANK;
  }

  unlockNext(): TalentProgress {
    if (!this.canUnlockNext()) {
      throw new Error("Already at maximum rank");
    }
    return new TalentProgress(this.voieId, this.rank + 1);
  }

  isMaxRank(): boolean {
    return this.rank === TalentProgress.MAX_RANK;
  }

  toPlainObject(): { voieId: string; rank: number } {
    return {
      voieId: this.voieId,
      rank: this.rank,
    };
  }

  static createFirst(voieId: string): TalentProgress {
    return new TalentProgress(voieId, TalentProgress.MIN_RANK);
  }
}
