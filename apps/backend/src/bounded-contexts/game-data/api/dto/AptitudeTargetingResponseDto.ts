import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Aptitude targeting DTO
 */
export class AptitudeTargetingResponseDto {
  @ApiProperty({ description: 'Target type', example: 'enemy' })
  type: string;

  @ApiPropertyOptional({ description: 'Range in cells', example: 3 })
  range?: number;

  @ApiPropertyOptional({ description: 'Area of effect', example: 1 })
  aoe?: number;
}
