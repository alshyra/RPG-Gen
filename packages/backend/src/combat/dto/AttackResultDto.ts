import { ApiProperty } from '@nestjs/swagger';

export class AttackResultDto {
  @ApiProperty({ description: 'Attacker identifier' })
  attacker: string;

  @ApiProperty({ description: 'Target identifier' })
  target: string;

  @ApiProperty({ description: 'Raw attack roll' })
  attackRoll: number;

  @ApiProperty({ description: 'Attack bonus applied' })
  attackBonus: number;

  @ApiProperty({ description: 'Total attack value (roll + bonus)' })
  totalAttack: number;

  @ApiProperty({ description: 'Target\'s AC' })
  targetAc: number;

  @ApiProperty({ description: 'Whether the attack hit' })
  hit: boolean;

  @ApiProperty({ description: 'Whether the attack was a critical hit' })
  critical: boolean;

  @ApiProperty({ description: 'Whether the attack was a fumble' })
  fumble: boolean;

  @ApiProperty({ description: 'Individual dice results for the damage roll', type: [Number] })
  damageRoll: number[];

  @ApiProperty({ description: 'Damage bonus applied' })
  damageBonus: number;

  @ApiProperty({ description: 'Total damage applied' })
  totalDamage: number;

  @ApiProperty({ description: 'Target\'s HP before the attack' })
  targetHpBefore: number;

  @ApiProperty({ description: 'Target\'s HP after the attack' })
  targetHpAfter: number;

  @ApiProperty({ description: 'Whether the target was defeated' })
  targetDefeated: boolean;
}
