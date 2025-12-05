import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AttackRequestDto {
  @ApiProperty({ description: 'Target ID to attack' })
  @IsString()
  targetId: string;
}
