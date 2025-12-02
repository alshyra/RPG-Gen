import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RollInstructionMessageDto } from '../chat/dto/RollInstructionMessageDto.js';

export class SubmitRollDto {
  @ApiProperty({
    type: RollInstructionMessageDto,
    isArray: true,
    description: 'Resolved instructions array',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RollInstructionMessageDto)
  instructions: RollInstructionMessageDto[];
}
