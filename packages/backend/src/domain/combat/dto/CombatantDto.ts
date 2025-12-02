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

  @ApiPropertyOptional({ description: 'Original ID for duplicated player entries (all share same originId)' })
  @IsOptional()
  @IsString()
  originId?: string;

  @ApiPropertyOptional({ description: 'Activation index for player duplicates (0-based)' })
  @IsOptional()
  @IsNumber()
  activationIndex?: number;
}
