import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ type: 'string', required: false, description: 'Player message to send to the conversation' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;
}
