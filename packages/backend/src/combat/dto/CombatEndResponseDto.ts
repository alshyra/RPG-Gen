import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CombatEndResultDto } from './CombatEndResultDto.js';

export class CombatEndResponseDto {
  @ApiProperty({ description: 'Whether the operation succeeded' })
  success: boolean;

  @ApiProperty({ description: 'Human readable message' })
  message: string;

  @ApiPropertyOptional({ description: 'Optional instructions returned after ending combat', type: [CombatEndResultDto] })
  instructions?: CombatEndResultDto[];
}
