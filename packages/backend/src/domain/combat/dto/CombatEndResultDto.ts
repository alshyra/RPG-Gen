import {
  ApiProperty,
} from '@nestjs/swagger';
import {
  IsOptional,
} from 'class-validator';
import { CombatEndDto } from './CombatEndDto.js';

export class CombatEndResultDto {
  @ApiProperty({
    description: 'Combat end information',
    type: CombatEndDto,
  })
  @IsOptional()
  combat_end: CombatEndDto;
}
