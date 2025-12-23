import { ClassStats } from '../value-objects/ClassStats.js';
import { TalentTree } from '../value-objects/TalentTree.js';

/**
 * CharacterClass aggregate root
 * 
 * Represents a playable class definition (Guerrier, Mage, Rogue, etc.)
 * This is READ-ONLY game data loaded from seed files.
 * 
 * @domain game-data
 * Pure TypeScript - no framework dependencies
 */
export class CharacterClass {
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly stats: ClassStats;
  readonly mainStat: string;
  readonly proficiencies: ReadonlyArray<string>;
  readonly startingAptitudes: ReadonlyArray<string>;
  readonly talentTrees: ReadonlyArray<TalentTree>;
  readonly color: string;
  readonly icon: string;

  constructor(props: {
    name: string;
    displayName?: string;
    description?: string;
    stats: ClassStats;
    mainStat?: string;
    proficiencies?: string[];
    startingAptitudes?: string[];
    talentTrees?: TalentTree[];
    color?: string;
    icon?: string;
  }) {
    if (!props.name) {
      throw new Error('Class name is required');
    }

    this.name = props.name;
    this.displayName = props.displayName ?? props.name;
    this.description = props.description ?? '';
    this.stats = props.stats;
    this.mainStat = props.mainStat ?? 'vigor';
    this.proficiencies = props.proficiencies ?? [];
    this.startingAptitudes = props.startingAptitudes ?? [];
    this.talentTrees = props.talentTrees ?? [];
    this.color = props.color ?? '#6b7280';
    this.icon = props.icon ?? '⚔️';
  }

  /**
   * Factory method to create CharacterClass from seed data
   */
  static fromSeedData(data: {
    name: string;
    displayName?: string;
    description?: string;
    baseStats: { hp_base: number; hp_gain?: number; pa: number; pm: number };
    main_stat?: string;
    proficiencies?: string[];
    startingAptitudes?: string[];
    talentTrees?: Record<string, { name: string; description?: string; ranks: Array<{ rank: number; aptitudeId: string; pointCost: number }> }>;
    color?: string;
    icon?: string;
  }): CharacterClass {
    const stats = new ClassStats({
      hpBase: data.baseStats.hp_base,
      hpGain: data.baseStats.hp_gain,
      pa: data.baseStats.pa,
      pm: data.baseStats.pm,
    });

    const talentTrees = data.talentTrees
      ? Object.entries(data.talentTrees).map(([voieId, tree]) =>
          new TalentTree({
            voieId,
            name: tree.name,
            description: tree.description,
            ranks: tree.ranks,
          })
        )
      : [];

    return new CharacterClass({
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      stats,
      mainStat: data.main_stat,
      proficiencies: data.proficiencies,
      startingAptitudes: data.startingAptitudes,
      talentTrees,
      color: data.color,
      icon: data.icon,
    });
  }

  /**
   * Calculate initial HP including vigor bonus
   */
  calculateInitialHp(vigorBonus: number = 0): number {
    return this.stats.hpBase + vigorBonus;
  }

  /**
   * Get HP at a specific level
   */
  getHpAtLevel(level: number, vigorBonus: number = 0): number {
    return this.stats.calculateHpAtLevel(level) + vigorBonus;
  }

  /**
   * Get all aptitude IDs from all talent trees
   */
  getAllTalentAptitudes(): string[] {
    return this.talentTrees.flatMap(tree => tree.getAllAptitudeIds());
  }

  /**
   * Find a talent tree by its voie ID
   */
  findTalentTree(voieId: string): TalentTree | undefined {
    return this.talentTrees.find(tree => tree.voieId === voieId);
  }

  /**
   * Check if an aptitude ID exists in any talent tree
   */
  hasAptitudeInTalentTrees(aptitudeId: string): boolean {
    return this.talentTrees.some(tree =>
      tree.getAllAptitudeIds().includes(aptitudeId)
    );
  }

  /**
   * Check if class has a proficiency
   */
  hasProficiency(stat: string): boolean {
    return this.proficiencies.includes(stat);
  }
}
