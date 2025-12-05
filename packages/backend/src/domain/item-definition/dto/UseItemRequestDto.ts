import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UseItemRequestDto {
  @ApiProperty({
    description: 'The inventory item _id to use',
    example: 'abc123-def456',
  })
  @IsString()
  @IsNotEmpty()
  itemId: string;
}
