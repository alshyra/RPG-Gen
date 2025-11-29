import { ApiProperty } from '@nestjs/swagger';

export class CombatantDto {
  @ApiProperty({ description: 'ID of the combatant (player character or enemy)' })
  id: string;

  @ApiProperty({ description: 'Combatant name' })
  name: string;

  @ApiProperty({ description: 'Initiative order value' })
  initiative: number;

  @ApiProperty({ description: 'Whether combatant is player character' })
  isPlayer: boolean;
}
