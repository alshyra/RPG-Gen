import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean } from 'class-validator';

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
}
