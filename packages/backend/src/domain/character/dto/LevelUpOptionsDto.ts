import { ApiProperty } from '@nestjs/swagger';
import { SpellResponseDto } from './SpellResponseDto.js';

export class LevelUpOptionsDto {
  @ApiProperty({ description: 'Class name' })
  className: string;

  @ApiProperty({ description: 'Current level in class' })
  currentLevel: number;

  @ApiProperty({ description: 'Next level number (current + 1)' })
  nextLevel: number;

  @ApiProperty({
    description: 'List of unlocked spells available at that level',
    type: [SpellResponseDto],
  })
  unlockedSpells: SpellResponseDto[];

  @ApiProperty({ description: 'Whether an Ability Score Improvement (or feat) is available at this level' })
  asiAvailable: boolean;

  @ApiProperty({ description: 'Whether proficiency bonus increases at this level' })
  proficiencyIncrease: boolean;

  @ApiProperty({ description: 'Number of cantrips (level 0 spells) the character can know at this level' })
  cantripsKnown: number;

  @ApiProperty({ description: 'Number of spells (level 1+) the character can know at this level' })
  spellsKnown: number;
}
