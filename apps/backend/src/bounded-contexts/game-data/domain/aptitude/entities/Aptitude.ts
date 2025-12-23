/**
 * Aptitude aggregate root
 * 
 * Represents an ability/spell/skill that characters can use.
 * This is READ-ONLY game data loaded from seed files.
 * 
 * @domain game-data
 * Pure TypeScript - no framework dependencies
 */
export type TargetType = 'self' | 'ally' | 'enemy' | 'area' | 'all_enemies' | 'all_allies';
export type ScalingStat = 'vigor' | 'finesse' | 'mind' | 'survival' | 'none';
export type EffectType = 'damage' | 'heal' | 'buff' | 'debuff' | 'utility' | 'summon';
export type MoveType = 'dash' | 'jump' | 'teleport' | 'push' | 'pull';
export type StatusEffect = 'bleed' | 'poison' | 'stun' | 'slow' | 'burn' | 'freeze' | 'silence';
export type AreaShape = 'circle_1' | 'circle_2' | 'circle_3' | 'line_3' | 'line_5' | 'cone_3';

export class Aptitude {
  readonly id: string;
  readonly name: string;
  readonly paCost: number;
  readonly cooldown: number;
  readonly targetType: TargetType;
  readonly range: number;
  readonly basePower: number;
  readonly scaling: ScalingStat;
  readonly effectType: EffectType;
  readonly moveType?: MoveType;
  readonly area?: AreaShape;
  readonly status?: StatusEffect;
  readonly descriptionForAi: string;

  constructor(props: {
    id: string;
    name: string;
    paCost?: number;
    cooldown?: number;
    targetType?: TargetType;
    range?: number;
    basePower?: number;
    scaling?: ScalingStat;
    effectType?: EffectType;
    moveType?: MoveType;
    area?: AreaShape;
    status?: StatusEffect;
    descriptionForAi?: string;
  }) {
    if (!props.id) {
      throw new Error('Aptitude ID is required');
    }
    if (!props.name) {
      throw new Error('Aptitude name is required');
    }

    this.id = props.id;
    this.name = props.name;
    this.paCost = props.paCost ?? 1;
    this.cooldown = props.cooldown ?? 0;
    this.targetType = props.targetType ?? 'enemy';
    this.range = props.range ?? 1;
    this.basePower = props.basePower ?? 0;
    this.scaling = props.scaling ?? 'none';
    this.effectType = props.effectType ?? 'damage';
    this.moveType = props.moveType;
    this.area = props.area;
    this.status = props.status;
    this.descriptionForAi = props.descriptionForAi ?? '';
  }

  /**
   * Factory method to create Aptitude from seed data
   */
  static fromSeedData(data: {
    id: string;
    name: string;
    paCost?: number;
    cooldown?: number;
    targetType?: TargetType;
    range?: number;
    basePower?: number;
    scaling?: ScalingStat;
    effectType?: EffectType;
    moveType?: MoveType;
    area?: AreaShape;
    status?: StatusEffect;
    descriptionForAi?: string;
  }): Aptitude {
    return new Aptitude(data);
  }

  /**
   * Check if aptitude requires line of sight
   */
  requiresLineOfSight(): boolean {
    return this.targetType !== 'self';
  }

  /**
   * Check if aptitude is an AoE ability
   */
  isAreaOfEffect(): boolean {
    return this.area !== undefined;
  }

  /**
   * Check if aptitude causes movement
   */
  causesMovement(): boolean {
    return this.moveType !== undefined;
  }

  /**
   * Check if aptitude applies a status effect
   */
  appliesStatus(): boolean {
    return this.status !== undefined;
  }

  /**
   * Check if aptitude is a healing ability
   */
  isHeal(): boolean {
    return this.effectType === 'heal' || this.targetType === 'ally';
  }

  /**
   * Calculate scaled power based on character stat
   */
  calculatePower(statValue: number, proficiencyBonus: number = 0): number {
    if (this.basePower === 0) return 0;
    
    const scalingBonus = this.scaling !== 'none' 
      ? Math.floor(statValue / 2) 
      : 0;
    
    return this.basePower + scalingBonus + proficiencyBonus;
  }
}
