import { Body, Controller, Post, BadRequestException, Logger, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import Joi from 'joi';
import { GeminiImageService } from '../external/image/gemini-image.service.js';
import { ImageService } from './image.service.js';
import { CharacterService } from '../character/character.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UserDocument } from '../schemas/user.schema.js';
import type { ImageRequest } from '@rpg-gen/shared';
import { CharacterDocument } from '../schemas/character.schema.js';

const schema = Joi.object({
  token: Joi.string().allow('').optional(),
  prompt: Joi.string().required(),
  model: Joi.string().optional(),
});

class CharacterIdBody {
  characterId: string;
}

@ApiTags('image')
@Controller('image')
export class ImageController {
  private readonly logger = new Logger(ImageController.name);

  constructor(
    private readonly geminiImage: GeminiImageService,
    private readonly imageService: ImageService,
    private readonly characterService: CharacterService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Generate image from prompt' })
  @ApiBody({ schema: { type: 'object' } })
  async generate(@Body() body: ImageRequest) {
    const { error } = schema.validate(body);
    if (error) throw new BadRequestException(error.message);
    // Image generation not implemented yet
    throw new BadRequestException('Image generation is not yet implemented');
  }

  @Post('generate-avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate character avatar from description' })
  @ApiBody({ type: [CharacterIdBody] })
  async generateAvatar(@Req() req: Request, @Body() body: CharacterIdBody) {
    if (!body.characterId) throw new BadRequestException('characterId is required');

    const user = req.user as UserDocument;
    const userId = user._id.toString();
    const character = await this.characterService.findByCharacterId(userId, body.characterId);

    if (!character) throw new BadRequestException('Character not found');

    return await this.handleGenerateAvatar(userId, character);
  }

  private async handleGenerateAvatar(userId: string, character: CharacterDocument) {
    try {
      // Generate avatar image
      const prompt = this.buildAvatarPrompt(character);
      const imageUrl = await this.geminiImage.generateImage(prompt);

      // Compress the image
      const compressedImage = await this.imageService.compressImage(imageUrl);

      // If characterId is provided, save to character
      if (character.characterId) {
        await this.saveAvatarToCharacter(userId, character.characterId, compressedImage);
      }

      return {
        imageUrl: compressedImage,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate avatar';
      this.logger.error('Avatar generation error:', message);
      throw new BadRequestException(`Avatar generation failed: ${message}`);
    }
  }

  private async saveAvatarToCharacter(userId: string, characterId: string, compressedImage: string) {
    await this.characterService.update(userId, characterId, {
      portrait: compressedImage,
    });
    this.logger.log(`Avatar saved to character ${characterId} for user ${userId}`);
  }

  private buildAvatarPrompt(character: CharacterDocument): string {
    const characterContext: string[] = [];
    if (character.name) characterContext.push(`Name: ${character.name}`);
    if (character.gender) characterContext.push(`Gender: ${character.gender}`);
    if (character.race?.name) characterContext.push(`Race: ${character.race.name}`);
    if (character.classes?.length) {
      const classNames = character.classes
        .map(c => c.name)
        .filter(Boolean)
        .join(', ');
      if (classNames) characterContext.push(`Classes: ${classNames}`);
    }

    const contextStr = characterContext.length ? `\n${characterContext.join('\n')}` : '';
    return `Generate a D&D character portrait based on this description:${contextStr}\n\nPhysical Description: ${character.physicalDescription}\n\nCreate a fantasy-style character portrait that matches this description. The image should be suitable for a D&D game character sheet.`;
  }
}
