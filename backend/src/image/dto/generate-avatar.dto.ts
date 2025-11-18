import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsObject } from 'class-validator';

export class GenerateAvatarDto {
  @ApiProperty({ description: 'ID of an existing character to attach the avatar to', required: false })
  @IsOptional()
  @IsString()
  characterId?: string;

  @ApiProperty({ description: 'Physical description used to generate the avatar', required: true })
  @IsString()
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ description: 'Optional character summary object (name, gender, race, classes)', required: false })
  @IsOptional()
  @IsObject()
  character?: Record<string, unknown>;
}
