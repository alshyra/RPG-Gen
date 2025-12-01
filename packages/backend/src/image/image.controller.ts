import {
  BadRequestException, Body, Controller, Logger, Post, Req, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import Joi from 'joi';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CharacterService } from '../character/character.service.js';
import { GeminiImageService } from '../external/image/gemini-image.service.js';
import { UserDocument } from '../auth/user.schema.js';
import {
  AvatarResponseDto, CharacterIdBodyDto, ImageRequestDto,
} from './dto/image-response.dto.js';
import { ImageService } from './image.service.js';
import type { CharacterResponseDto } from 'src/character/dto/CharacterResponseDto.js';

const schema = Joi.object({
  token: Joi.string()
    .allow('')
    .optional(),
  prompt: Joi.string()
    .required(),
  model: Joi.string()
    .optional(),
});

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
  @ApiBody({ type: ImageRequestDto })
  @ApiResponse({
    status: 400,
    description: 'Image generation not implemented',
  })
  async generate(@Body() body: ImageRequestDto) {
    const { error } = schema.validate(body);
    if (error) throw new BadRequestException(error.message);
    // Image generation not implemented yet
    throw new BadRequestException('Image generation is not yet implemented');
  }

  @Post('generate-avatar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate character avatar from description' })
  @ApiBody({ type: CharacterIdBodyDto })
  @ApiResponse({
    status: 201,
    description: 'Avatar generated successfully',
    type: AvatarResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or avatar generation failed',
  })
  async generateAvatar(@Req() req: Request, @Body('characterId') characterId: string) {
    this.logger.log(`Received avatar generation request payload: ${JSON.stringify(characterId)}`);

    if (!characterId || typeof characterId !== 'string') throw new BadRequestException('characterId is required');

    const user = req.user as UserDocument;
    const userId = user._id.toString();
    const character = await this.characterService.findByCharacterId(userId, characterId);
    return await this.handleGenerateAvatar(userId, character);
  }

  private async handleGenerateAvatar(userId: string, character: CharacterResponseDto) {
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

      return { imageUrl: compressedImage };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate avatar';
      this.logger.error('Avatar generation error:', message);
      throw new BadRequestException(`Avatar generation failed: ${message}`);
    }
  }

  private async saveAvatarToCharacter(userId: string, characterId: string, compressedImage: string) {
    await this.characterService.update(userId, characterId, { portrait: compressedImage });
    this.logger.log(`Avatar saved to character ${characterId} for user ${userId}`);
  }

  private buildAvatarPrompt(character: CharacterResponseDto): string {
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
