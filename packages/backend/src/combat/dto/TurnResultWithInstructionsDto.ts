import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TurnResultDto } from './TurnResultDto.js';

export class TurnResultWithInstructionsDto extends TurnResultDto {
  @ApiPropertyOptional({ description: 'Optional set of frontend instructions to apply after the turn', type: 'array', items: { type: 'object' } as any })
  instructions?: unknown[];
}
