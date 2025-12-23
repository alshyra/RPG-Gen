import { ApiProperty } from '@nestjs/swagger';
import type { GameInstructionDto } from './response/GameInstructionDto.js';

/**
 * Response DTO for narrative chat operations
 */
export class NarrativeResponseDto {
  @ApiProperty({ description: 'Narrative narrative content' })
  narrative: string;

  @ApiProperty({ description: 'Game instructions' })
  instructions?: GameInstructionDto[];

  constructor(partial: Partial<NarrativeResponseDto>) {
    Object.assign(this, partial);
  }
}
