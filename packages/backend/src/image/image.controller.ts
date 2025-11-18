import { BadRequestException, Controller, Logger, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CharacterDocument } from 'src/schemas/character.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CharacterService } from '../character/character.service';
import { GeminiImageService } from '../external/image/gemini-image.service';
import { UserDocument } from '../schemas/user.schema';
import { ImageService } from './image.service';

@ApiTags('image')
@Controller('image')
export class ImageController {
  private readonly logger = new Logger(ImageController.name);

  constructor(
    private readonly geminiImage: GeminiImageService,
    private readonly imageService: ImageService,
    private readonly characterService: CharacterService,
  ) {}

  @Post(':characterId/generate-avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate character avatar from description' })
  @ApiParam({ name: 'characterId', required: true })
  async generateAvatar(@Req() req: Request, @Param('characterId') characterId: string) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();
    const character = await this.characterService.findByCharacterId(userId, characterId);
    if (!character) throw new BadRequestException('character not found');
    character.portrait = await this.handlePortrait(userId, character);
    return await this.saveAvatarToCharacter(userId, character);
  }

  private async handlePortrait(userId: string, character: CharacterDocument) {
    const prompt = this.buildAvatarPrompt(character);
    const imageUrl = await this.geminiImage.generateImage(prompt);
    return await this.imageService.compressImage(imageUrl);
  }

  private async saveAvatarToCharacter(userId: string, { portrait, _id, characterId }: CharacterDocument) {
    await this.characterService.update(userId, characterId, { portrait });
    this.logger.log(`Avatar saved to character ${_id.toString()} for user ${userId}`);
  }

  private buildAvatarPrompt(character: CharacterDocument): string {
    const characterContext = [
      `Name: ${character.name}`,
      `Gender: ${character.gender}`,
      `Race: ${character.race?.name}`,
      `Classe: ${character.classes[0]?.name}`,
    ];

    const contextStr = `${characterContext.join('\n')}`;
    return `Generate a D&D character portrait based on this description:
${contextStr}
\nPhysical Description: ${character.physicalDescription}
\nCreate a fantasy-style character portrait that matches this description. The image should be suitable for a D&D game character sheet.`;
  }
}
