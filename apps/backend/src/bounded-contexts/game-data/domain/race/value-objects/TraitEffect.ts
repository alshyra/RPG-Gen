/**
 * Value Object representing a racial trait effect
 * 
 * @domain game-data
 * Pure TypeScript - no framework dependencies
 */
export type TraitEffectType = 
  | 'PA_BONUS'
  | 'PM_BONUS'
  | 'DAMAGE_REDUCTION'
  | 'DAMAGE_BOOST'
  | 'HEAL_BOOST'
  | 'CRIT_BONUS';

export type TraitCondition =
  | 'permanent'
  | 'turn_1'
  | 'hp_below_50'
  | 'hp_below_25'
  | 'all_abilities';

export class TraitEffect {
  readonly type: TraitEffectType;
  readonly value: number;
  readonly subType?: string;
  readonly condition: TraitCondition;

  constructor(props: {
    type: TraitEffectType;
    value: number;
    subType?: string;
    condition?: TraitCondition;
  }) {
    this.type = props.type;
    this.value = props.value;
    this.subType = props.subType;
    this.condition = props.condition ?? 'permanent';
  }

  equals(other: TraitEffect): boolean {
    return (
      this.type === other.type &&
      this.value === other.value &&
      this.subType === other.subType &&
      this.condition === other.condition
    );
  }
}
