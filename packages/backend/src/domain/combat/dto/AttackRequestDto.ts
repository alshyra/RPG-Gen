import { ApiProperty } from '@nestjs/swagger';

export class AttackRequestDto {
  @ApiProperty({ description: 'Target ID to attack' })
  targetId: string;
}
