import { ApiProperty } from '@nestjs/swagger';

export class CreateCharacterBodyDto {
  @ApiProperty({ description: 'Game world (e.g., dnd, vtm)' })
  world: string;
}
