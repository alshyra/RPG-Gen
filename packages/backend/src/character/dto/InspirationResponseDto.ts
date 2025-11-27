import { ApiProperty } from '@nestjs/swagger';
import { CharacterResponseDto } from './CharacterResponseDto.js';

export class InspirationResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  ok: boolean;

  @ApiProperty({ description: 'Updated inspiration points count' })
  inspirationPoints: number;

  @ApiProperty({ description: 'Updated character', type: CharacterResponseDto })
  character: CharacterResponseDto;
}
