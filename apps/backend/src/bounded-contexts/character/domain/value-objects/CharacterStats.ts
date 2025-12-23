/**
 * Value Object representing character stats (Vigor, Finesse, Mind, Survival).
 * Immutable - all modifications return a new instance.
 */
export class CharacterStats {
  public readonly vigor: number;
  public readonly finesse: number;
  public readonly mind: number;
  public readonly survival: number;

  constructor(stats: { vigor: number; finesse: number; mind: number; survival: number }) {
    this.vigor = stats.vigor;
    this.finesse = stats.finesse;
    this.mind = stats.mind;
    this.survival = stats.survival;
    this.validate();
  }

  private validate(): void {
    const stats = [this.vigor, this.finesse, this.mind, this.survival];
    if (stats.some(s => s < 0)) {
      throw new Error("Stats cannot be negative");
    }
  }

  getTotalPoints(): number {
    return this.vigor + this.finesse + this.mind + this.survival;
  }

  getVigorModifier(): number {
    return Math.floor(this.vigor / 2);
  }

  getFinesseModifier(): number {
    return Math.floor(this.finesse / 2);
  }

  getMindModifier(): number {
    return Math.floor(this.mind / 2);
  }

  getSurvivalModifier(): number {
    return Math.floor(this.survival / 2);
  }

  withVigor(newVigor: number): CharacterStats {
    return new CharacterStats({
      vigor: newVigor,
      finesse: this.finesse,
      mind: this.mind,
      survival: this.survival,
    });
  }

  withFinesse(newFinesse: number): CharacterStats {
    return new CharacterStats({
      vigor: this.vigor,
      finesse: newFinesse,
      mind: this.mind,
      survival: this.survival,
    });
  }

  withMind(newMind: number): CharacterStats {
    return new CharacterStats({
      vigor: this.vigor,
      finesse: this.finesse,
      mind: newMind,
      survival: this.survival,
    });
  }

  withSurvival(newSurvival: number): CharacterStats {
    return new CharacterStats({
      vigor: this.vigor,
      finesse: this.finesse,
      mind: this.mind,
      survival: newSurvival,
    });
  }

  toPlainObject(): { vigor: number; finesse: number; mind: number; survival: number } {
    return {
      vigor: this.vigor,
      finesse: this.finesse,
      mind: this.mind,
      survival: this.survival,
    };
  }

  static createDefault(): CharacterStats {
    return new CharacterStats({
      vigor: 0,
      finesse: 0,
      mind: 0,
      survival: 0,
    });
  }
}
