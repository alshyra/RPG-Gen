import { ApiProperty } from '@nestjs/swagger';

/**
 * AuthProfileDto - Public API response for user profile
 *
 * Contains only publicly-safe user data.
 * Returned by /auth/profile endpoint.
 */
export class AuthProfileDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe', required: false })
  displayName?: string;

  @ApiProperty({ example: 'https://...' })
  picture?: string;
}
