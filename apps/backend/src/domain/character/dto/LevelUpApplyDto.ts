import { ApiPropertyOptional } from '@nestjs/swagger';

export class LevelUpApplyDto {
  @ApiPropertyOptional({ description: 'List of spell definitionIds to add to the character' })
  newSpellIds?: string[];

  @ApiPropertyOptional({
    description: 'Ability score increases, e.g. [{ ability: "Str", inc: 1 }] ',
  })
  abilityIncreases?: {
    ability: string;
    inc: number;
  }[];
}
