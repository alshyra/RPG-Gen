import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CombatEndDto {
  @ApiProperty({ description: 'Victory state' })
  victory: boolean;

  @ApiProperty({ description: 'XP gained' })
  xp_gained: number;

  @ApiProperty({ description: 'Player\'s HP at the end' })
  player_hp: number;

  @ApiProperty({ description: 'Enemies that were defeated' })
  enemies_defeated: string[];

  @ApiPropertyOptional({ description: 'Flee indicator' })
  fled?: boolean;

  @ApiProperty({ description: 'Narrative summary' })
  narrative: string;
}

export class CombatEndResultDto {
  @ApiProperty({ description: 'Combat end information', type: CombatEndDto })
  combat_end: CombatEndDto;
}
