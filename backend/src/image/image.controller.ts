import { Body, Controller, Post, BadRequestException, Logger } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";
import * as Joi from "joi";
import { GeminiImageService } from "../external/image/gemini-image.service";
import type { ImageRequest, AvatarRequest } from "../../../shared/types";

const schema = Joi.object({
  token: Joi.string().allow("").optional(),
  prompt: Joi.string().required(),
  model: Joi.string().optional(),
});

@ApiTags("image")
@Controller("image")
export class ImageController {
  private readonly logger = new Logger(ImageController.name);

  constructor(private readonly geminiImage: GeminiImageService) {}

  @Post()
  @ApiOperation({ summary: "Generate image from prompt" })
  @ApiBody({ schema: { type: "object" } })
  async generate(@Body() body: ImageRequest) {
    const { error } = schema.validate(body);
    if (error) throw new BadRequestException(error.message);
    // Image generation not implemented yet
    throw new BadRequestException("Image generation is not yet implemented");
  }

  @Post("generate-avatar")
  @ApiOperation({ summary: "Generate character avatar from description" })
  @ApiBody({ schema: { type: "object" } })
  async generateAvatar(@Body() body: AvatarRequest) {
    this.validateAvatarRequest(body);
    try {
      const prompt = this.buildAvatarPrompt(body);
      const imageUrl = await this.geminiImage.generateImage(prompt);
      return { imageUrl };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate avatar";
      this.logger.error("Avatar generation error:", message);
      throw new BadRequestException(`Avatar generation failed: ${message}`);
    }
  }

  private validateAvatarRequest(body: AvatarRequest) {
    if (!body.description || typeof body.description !== "string") {
      throw new BadRequestException("Description is required and must be a string");
    }
  }

  private buildAvatarPrompt(body: AvatarRequest): string {
    const characterContext: string[] = [];
    if (body.character?.name) characterContext.push(`Name: ${body.character.name}`);
    if (body.character?.gender) characterContext.push(`Gender: ${body.character.gender}`);
    if (body.character?.race?.name) characterContext.push(`Race: ${body.character.race.name}`);
    if (body.character?.classes?.length) {
      const classNames = body.character.classes
        .map((c) => c.name)
        .filter(Boolean)
        .join(", ");
      if (classNames) characterContext.push(`Classes: ${classNames}`);
    }

    const contextStr = characterContext.length ? `\n${characterContext.join("\n")}` : "";
    return `Generate a D&D character portrait based on this description:${contextStr}\n\nPhysical Description: ${body.description}\n\nCreate a fantasy-style character portrait that matches this description. The image should be suitable for a D&D game character sheet.`;
  }
}
