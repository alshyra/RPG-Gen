import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../auth/infrastructure/auth/guards/JwtAuthGuard.js";
import { CharacterAppService } from "../../application/services/CharacterAppService.js";
import { CharacterEntity } from "../../domain/entities/CharacterEntity.js";
import { GeminiImageService } from "../../infrastructure/external/GeminiImageService.js";
import { AvatarResponseDto } from "../dto/response/AvatarResponseDto.js";
import { GenerateAvatarRequestDto } from "../dto/request/GenerateAvatarRequestDto.js";
import { ImageService } from "../../domain/services/ImageService.js";
import type { RPGRequest } from "../../../../global.types.js";

@ApiTags("character")
@Controller("character/avatar")
export class CharacterAvatarController {
  private readonly logger = new Logger(CharacterAvatarController.name);

  constructor(
    private readonly geminiImage: GeminiImageService,
    private readonly imageService: ImageService,
    private readonly characterAppService: CharacterAppService,
  ) {}

  @Post("generate")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Generate character avatar from description" })
  @ApiBody({ type: GenerateAvatarRequestDto })
  @ApiResponse({
    status: 201,
    description: "Avatar generated successfully",
    type: AvatarResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid request or avatar generation failed",
  })
  async generateAvatar(@Req() req: RPGRequest, @Body("characterId") characterId: string) {
    this.logger.log(`Received avatar generation request payload: ${JSON.stringify(characterId)}`);

    if (!characterId || typeof characterId !== "string")
      throw new BadRequestException("characterId is required");

    const { user } = req;
    const userId = user.id;
    const characterEntity = await this.characterAppService.findByUserAndId(userId, characterId);
    return await this.handleGenerateAvatar(userId, characterEntity);
  }

  private async handleGenerateAvatar(userId: string, character: CharacterEntity) {
    try {
      // Generate avatar image
      const prompt = this.buildAvatarPrompt(character);
      const imageUrl = await this.geminiImage.generateImage(prompt);

      // Compress the image
      const compressedImage = await this.imageService.compressImage(imageUrl);

      // If characterId is provided, save to character
      if (character.id) {
        await this.saveAvatarToCharacter(userId, character.id, compressedImage);
      }

      return { imageUrl: compressedImage };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate avatar";
      this.logger.error("Avatar generation error:", message);
      throw new BadRequestException(`Avatar generation failed: ${message}`);
    }
  }

  private async saveAvatarToCharacter(
    userId: string,
    characterId: string,
    compressedImage: string,
  ) {
    await this.characterAppService.update(userId, characterId, { portrait: compressedImage });
    this.logger.log(`Avatar saved to character ${characterId} for user ${userId}`);
  }

  private buildAvatarPrompt(character: CharacterEntity): string {
    const characterContext: string[] = [];
    if (character.name) characterContext.push(`Name: ${character.name}`);
    if (character.gender) characterContext.push(`Gender: ${character.gender}`);
    if (character.raceId) characterContext.push(`Race: ${character.raceId}`);
    if (character.className) {
      characterContext.push(`Class: ${character.className}`);
    }

    const contextStr = characterContext.length ? `\n${characterContext.join("\n")}` : "";
    return `Generate a fantasy character portrait based on this description:${contextStr}\n\nPhysical Description: ${character.physicalDescription}\n\nCreate a fantasy-style character portrait that matches this description.`;
  }
}
