import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class BaseMeta {
  @ApiPropertyOptional({ description: 'Item type discriminator' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Item cost (gold pieces or formatted string)' })
  @IsOptional()
  cost?: string | number;

  @ApiPropertyOptional({ description: 'Item weight in pounds' })
  @IsOptional()
  weight?: string | number;

  @ApiPropertyOptional({ description: 'Whether this is a starter item' })
  @IsOptional()
  @IsBoolean()
  starter?: boolean;
}
