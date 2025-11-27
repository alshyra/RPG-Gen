import { ApiPropertyOptional } from '@nestjs/swagger';

export class SkillResponseDto {
  @ApiPropertyOptional({ description: 'Skill name' })
  name?: string;

  @ApiPropertyOptional({ description: 'Is proficient in this skill' })
  proficient?: boolean;

  @ApiPropertyOptional({ description: 'Skill modifier' })
  modifier?: number;
}
