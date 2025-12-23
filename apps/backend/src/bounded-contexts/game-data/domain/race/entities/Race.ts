import { RacialBonuses } from '../value-objects/RacialBonuses.js';
import { TraitEffect, TraitEffectType, TraitCondition } from '../value-objects/TraitEffect.js';

/**
 * Race aggregate root
 * 
 * Represents a playable race definition (Humain, Elfe, Nain, etc.)
 * This is READ-ONLY game data loaded from seed files.
 * 
 * @domain game-data
 * Pure TypeScript - no framework dependencies
 */
export class Race {
  readonly id: string;
  readonly name: string;
  readonly bonuses: RacialBonuses;
  readonly trait: string;
  readonly traitEffect: TraitEffect;
  readonly descriptionForAi: string;
  readonly icon: string;
  readonly color: string;

  constructor(props: {
    id: string;
    name: string;
    bonuses: RacialBonuses;
    trait: string;
    traitEffect: TraitEffect;
    descriptionForAi?: string;
    icon?: string;
    color?: string;
  }) {
    if (!props.id) {
      throw new Error('Race ID is required');
    }
    if (!props.name) {
      throw new Error('Race name is required');
    }

    this.id = props.id;
    this.name = props.name;
    this.bonuses = props.bonuses;
    this.trait = props.trait;
    this.traitEffect = props.traitEffect;
    this.descriptionForAi = props.descriptionForAi ?? '';
    this.icon = props.icon ?? '👤';
    this.color = props.color ?? '#6b7280';
  }

  /**
   * Factory method to create Race from seed data
   */
  static fromSeedData(data: {
    id: string;
    name: string;
    bonuses: { vigor?: number; finesse?: number; mind?: number; survival?: number; '*'?: number };
    trait: string;
    traitEffect: { type: TraitEffectType; value: number; subType?: string; condition?: TraitCondition };
    descriptionForAi?: string;
    icon?: string;
    color?: string;
  }): Race {
    return new Race({
      id: data.id,
      name: data.name,
      bonuses: new RacialBonuses(data.bonuses),
      trait: data.trait,
      traitEffect: new TraitEffect(data.traitEffect),
      descriptionForAi: data.descriptionForAi,
      icon: data.icon,
      color: data.color,
    });
  }

  /**
   * Get bonus for a specific stat
   */
  getBonusForStat(stat: 'vigor' | 'finesse' | 'mind' | 'survival'): number {
    return this.bonuses[stat];
  }

  /**
   * Check if trait applies under current conditions
   */
  isTraitActive(context: { turn?: number; hpPercent?: number }): boolean {
    switch (this.traitEffect.condition) {
      case 'permanent':
        return true;
      case 'turn_1':
        return context.turn === 1;
      case 'hp_below_50':
        return (context.hpPercent ?? 100) < 50;
      case 'hp_below_25':
        return (context.hpPercent ?? 100) < 25;
      case 'all_abilities':
        return true;
      default:
        return false;
    }
  }
}
