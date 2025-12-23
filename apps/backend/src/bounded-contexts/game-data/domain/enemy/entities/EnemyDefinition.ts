/**
 * EnemyDefinition aggregate root
 * 
 * Represents an enemy template used to spawn combat enemies.
 * This is READ-ONLY game data loaded from seed files.
 * NOT exposed via API (backend-only).
 * 
 * @domain game-data
 * Pure TypeScript - no framework dependencies
 */
export class EnemyDefinition {
  readonly id: string;
  readonly name: string;
  readonly hp: number;
  readonly attackBonus: number;
  readonly damageDice: string;
  readonly damageBonus: number;
  readonly aptitudes: ReadonlyArray<string>;
  readonly level: number;

  constructor(props: {
    id?: string;
    name: string;
    hp: number;
    attackBonus?: number;
    damageDice?: string;
    damageBonus?: number;
    aptitudes?: string[];
    level?: number;
  }) {
    if (!props.name) {
      throw new Error('Enemy name is required');
    }
    if (props.hp < 1) {
      throw new Error('Enemy HP must be at least 1');
    }

    // Generate ID from name if not provided
    this.id = props.id ?? this.generateId(props.name);
    this.name = props.name;
    this.hp = props.hp;
    this.attackBonus = props.attackBonus ?? 0;
    this.damageDice = props.damageDice ?? '1d6';
    this.damageBonus = props.damageBonus ?? 0;
    this.aptitudes = props.aptitudes ?? [];
    this.level = props.level ?? this.estimateLevel(props.hp);
  }

  private generateId(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private estimateLevel(hp: number): number {
    // Rough estimation based on HP
    if (hp <= 10) return 1;
    if (hp <= 20) return 2;
    if (hp <= 35) return 3;
    if (hp <= 50) return 4;
    if (hp <= 70) return 5;
    return Math.min(10, Math.floor(hp / 15));
  }

  /**
   * Factory method to create EnemyDefinition from seed data
   */
  static fromSeedData(data: {
    name: string;
    hp: number;
    attack_bonus?: number;
    damage_dice?: string;
    damage_bonus?: number;
    aptitudes?: string[];
    level?: number;
  }): EnemyDefinition {
    return new EnemyDefinition({
      name: data.name,
      hp: data.hp,
      attackBonus: data.attack_bonus,
      damageDice: data.damage_dice,
      damageBonus: data.damage_bonus,
      aptitudes: data.aptitudes,
      level: data.level,
    });
  }

  /**
   * Calculate average damage per hit
   */
  getAverageDamage(): number {
    // Parse dice notation (e.g., "2d6" -> avg 7)
    const match = this.damageDice.match(/(\d+)d(\d+)/);
    if (!match) return this.damageBonus;
    
    const numDice = parseInt(match[1], 10);
    const dieSize = parseInt(match[2], 10);
    const avgRoll = numDice * ((dieSize + 1) / 2);
    
    return Math.floor(avgRoll) + this.damageBonus;
  }

  /**
   * Estimate challenge rating based on stats
   */
  getChallengeRating(): number {
    const hpFactor = this.hp / 10;
    const damageFactor = this.getAverageDamage() / 5;
    const attackFactor = this.attackBonus / 3;
    
    return Math.max(0.25, Math.floor((hpFactor + damageFactor + attackFactor) / 3));
  }
}
