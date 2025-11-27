import { ApiProperty } from '@nestjs/swagger';

export class AuthProfileDto {
  @ApiProperty({ description: 'Id de l\'utilisateur' })
  id: string;

  @ApiProperty({ description: 'Email de l\'utilisateur' })
  email: string;

  @ApiProperty({ description: 'Nom affiché de l\'utilisateur' })
  displayName: string;

  @ApiProperty({ description: 'URL de la photo de profil de l\'utilisateur' })
  picture: string;
}
