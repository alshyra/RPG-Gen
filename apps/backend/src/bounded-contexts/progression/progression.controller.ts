import { Body, Controller, Get, Param, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/domain/jwt-auth.guard.js";
import { CharacterResponseDto, DraftCharacterResponseDto } from "../character/api/dto/index.js";
import { CharacterDtoMapper } from "../character/api/dto/mappers/CharacterDtoMapper.js";
import {
  ClassMetadataDto,
  RaceMetadataDto,
  SelectClassDto,
  SelectFirstTalentDto,
  UnlockRankDto
} from "./api/dto/index.js";
import { ProgressionService } from "./progression.service.js";
import { type RPGRequest } from "../../global.types.js";

@ApiTags("progression")
@Controller("progression")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgressionController {
  constructor(
    private readonly progressionService: ProgressionService,
    private readonly dtoMapper: CharacterDtoMapper,
  ) {}

  @Get("classes")
  @ApiOperation({ summary: "Get available classes for character creation" })
  @ApiResponse({ status: 200, description: "List of available classes with metadata" })
  @ApiResponse({type: [ClassMetadataDto]})
  getAvailableClasses() {
    return this.progressionService.getAvailableClasses();
  }

  @Get("races")
  @ApiOperation({ summary: "Get available races for character creation" })
  @ApiResponse({ status: 200, description: "List of available races with bonuses and traits", type: [RaceMetadataDto] })
  async getAvailableRaces() {
    return this.progressionService.getAvailableRaces();
  }

  @Post(":characterId/select-class")
  @ApiOperation({ summary: "Select a class for a character and assign starter pack" })
  @ApiBody({ type: SelectClassDto })
  @ApiResponse({ status: 200, description: "Class selected and starter pack assigned", type: CharacterResponseDto })
  @ApiResponse({ status: 400, description: "Invalid class name" })
  @ApiResponse({ status: 404, description: "Character not found" })
  async selectClass(
    @Request() req: RPGRequest,
    @Param("characterId") characterId: string,
    @Body("className") className: string,
  ) {
    const { user } = req;

    const userId = user._id.toString();
    const character = await this.progressionService.selectClass(userId, characterId, className);
    return this.dtoMapper.toEnrichedDtoFromDocument(character);
  }

  @Post(":characterId/select-race")
  @ApiOperation({ summary: "Select a race for a character and apply bonuses" })
  @ApiBody({ schema: { properties: { raceId: { type: "string" } } } })
  @ApiResponse({ status: 200, description: "Race selected and bonuses applied", type: DraftCharacterResponseDto })
  @ApiResponse({ status: 400, description: "Invalid race ID" })
  @ApiResponse({ status: 404, description: "Character not found" })
  async selectRace(
    @Request() req: RPGRequest,
    @Param("characterId") characterId: string,
    @Body("raceId") raceId: string,
  ) {
    const { user } = req;

    const userId = user._id.toString();
    const character = await this.progressionService.selectRace(userId, characterId, raceId);
    return this.dtoMapper.toEnrichedDtoFromDocument(character);
  }

  @Post(":characterId/unlock-rank")
  @ApiOperation({ summary: "Unlock a rank in a talent tree (voie)" })
  @ApiResponse({ status: 200, description: "Rank unlocked successfully", type: CharacterResponseDto })
  @ApiResponse({ status: 400, description: "Not enough talent points or invalid rank" })
  @ApiResponse({ status: 404, description: "Character not found" })
  async unlockRank(
    @Request() req: RPGRequest,
    @Param("characterId") characterId: string,
    @Body() dto: UnlockRankDto,
  ) {
    const character = await this.progressionService.unlockRank(
      req.user.sub,
      characterId,
      dto.voieId,
      dto.rank,
    );
    return this.dtoMapper.toEnrichedDtoFromDocument(character);
  }

  @Post(":characterId/first-talent")
  @ApiOperation({ summary: "Select first talent during character creation (unlock rank 1 + stat bonus)" })
  @ApiResponse({ status: 200, description: "First talent selected successfully", type: CharacterResponseDto })
  @ApiResponse({ status: 400, description: "Invalid voie name or stat" })
  @ApiResponse({ status: 404, description: "Character not found" })
  async selectFirstTalent(
    @Request() req: RPGRequest,
    @Param("characterId") characterId: string,
    @Body() dto: SelectFirstTalentDto,
  ) {
    const { user } = req;
    const userId = user._id.toString();
    
    const character = await this.progressionService.selectFirstTalent(
      userId,
      characterId,
      dto.voieName,
      dto.statBonus,
    );
    
    return this.dtoMapper.toEnrichedDtoFromDocument(character);
  }
}
