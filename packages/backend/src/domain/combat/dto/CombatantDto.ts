import {
  ApiProperty, ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsString, IsNumber, IsBoolean, IsOptional,
} from 'class-validator';

export class CombatantDto {
  @ApiProperty({ description: 'ID of the combatant (player character or enemy)' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Combatant name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Initiative order value' })
  @IsNumber()
  initiative: number;

  @ApiProperty({ description: 'Whether combatant is player character' })
  @IsBoolean()
  isPlayer: boolean;

  @ApiPropertyOptional({ description: 'Current hit points (enemies only)' })
  @IsOptional()
  @IsNumber()
  hp?: number;

  @ApiPropertyOptional({ description: 'Maximum hit points (enemies only)' })
  @IsOptional()
  @IsNumber()
  hpMax?: number;

  @ApiPropertyOptional({ description: 'Armor class (enemies only)' })
  @IsOptional()
  @IsNumber()
  ac?: number;

  @ApiPropertyOptional({ description: 'Enemy attack bonus (enemies only)' })
  @IsOptional()
  @IsNumber()
  attackBonus?: number;

  @ApiPropertyOptional({ description: 'Enemy damage dice expression (enemies only), e.g. "1d6"' })
  @IsOptional()
  @IsString()
  damageDice?: string;

  @ApiPropertyOptional({ description: 'Enemy damage bonus (enemies only)' })
  @IsOptional()
  @IsNumber()
  damageBonus?: number;

  constructor(init?: Partial<CombatantDto>) {
    // assign provided fields
    Object.assign(this, init);
    // defaults
    if (this.isPlayer === undefined) this.isPlayer = false;
    if (this.initiative === undefined) this.initiative = 0;
  }
}
