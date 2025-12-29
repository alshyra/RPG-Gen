import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../auth/infrastructure/auth/guards/JwtAuthGuard.js";
import type { RPGRequest } from "../../../../global.types.js";
import { CharacterAppService } from "../../application/services/CharacterAppService.js";
import { CharacterDtoMapper } from "../dto/mappers/CharacterDtoMapper.js";
import { GrantInspirationBodyDto } from "../dto/request/index.js";
import { InspirationResponseDto } from "../dto/response/index.js";

@ApiTags("character-inspiration")
@Controller("characters/:characterId/inspiration")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CharacterInspirationController {
  private readonly logger = new Logger(CharacterInspirationController.name);

  constructor(
    private characterAppService: CharacterAppService,
    private dtoMapper: CharacterDtoMapper,
  ) {}

  @Post("grant")
  @ApiOperation({ summary: "Grant inspiration point(s) to a character" })
  @ApiBody({ type: GrantInspirationBodyDto })
  @ApiResponse({
    status: 201,
    description: "Inspiration granted",
    type: InspirationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Invalid amount",
  })
  @ApiResponse({
    status: 404,
    description: "Character not found",
  })
  async grant(
    @Req() req: RPGRequest,
    @Param("characterId") characterId: string,
    @Body("amount") amount: number,
  ) {
    const { user } = req;
    const userId = user._id.toString();

    // Validate amount
    if (typeof amount !== "number" || amount <= 0 || amount > 5) {
      throw new BadRequestException("Amount must be a positive number between 1 and 5");
    }

    const character = await this.characterAppService.findByUserAndId(userId, characterId);
    // Cap inspiration points at 5 (D&D 5e rule)
    const currentPoints = character.inspirationPoints || 0;
    const newPoints = Math.min(currentPoints + amount, 5);
    const updated = await this.characterAppService.update(userId, characterId, {
      inspirationPoints: newPoints,
    });

    return {
      ok: true,
      inspirationPoints: updated.inspirationPoints,
      character: CharacterDtoMapper.toDto(updated),
    };
  }

  @Post("spend")
  @ApiOperation({ summary: "Spend an inspiration point" })
  @ApiResponse({
    status: 201,
    description: "Inspiration spent",
    type: InspirationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "No inspiration points available",
  })
  @ApiResponse({
    status: 404,
    description: "Character not found",
  })
  async spend(@Req() req: RPGRequest, @Param("characterId") characterId: string) {
    const { user } = req;
    const userId = user._id.toString();

    const character = await this.characterAppService.findByUserAndId(userId, characterId);
    const currentPoints = character.inspirationPoints || 0;
    if (currentPoints <= 0) {
      throw new BadRequestException("No inspiration points available");
    }

    const updated = await this.characterAppService.update(userId, characterId, {
      inspirationPoints: currentPoints - 1,
    });

    return {
      ok: true,
      inspirationPoints: updated.inspirationPoints,
      character: CharacterDtoMapper.toDto(updated),
    };
  }
}
