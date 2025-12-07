import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AttackRequestDto {
  @ApiProperty({ description: 'Target ID to attack' })
  @IsString()
  targetId: string;

  @ApiPropertyOptional({ description: 'Optional spell name to cast instead of weapon attack' })
  @IsOptional()
  @IsString()
  spellName?: string;
}
