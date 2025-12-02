import {
  OmitType, PartialType,
} from '@nestjs/swagger';
import { BaseCharacterResponseDto } from './BaseCharacterResponseDto.js';

export class UpdateCharacterRequestDto extends PartialType(
  OmitType(BaseCharacterResponseDto, [
    'characterId',
    'isDeceased',
    'diedAt',
    'deathLocation',
  ] as const),
) {}
