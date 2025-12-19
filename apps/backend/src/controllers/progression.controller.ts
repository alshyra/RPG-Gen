import { Controller, Post, Get, Body, Param, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../domain/auth/jwt-auth.guard.js";
import { ProgressionService } from "../domain/progression/progression.service.js";
import { 
  SelectClassDto, 
  SelectRaceDto, 
  UnlockRankDto,
  ClassMetadataDto,
  RaceMetadataDto 
} from "../domain/progression/dto/index.js";

@ApiTags("progression")
@Controller("progression")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgressionController {
  constructor(private readonly progressionService: ProgressionService) {}

  @Get("classes")
  @ApiOperation({ summary: "Get available classes for character creation" })
  @ApiResponse({ status: 200, description: "List of available classes with metadata", type: [ClassMetadataDto] })
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
  @ApiResponse({ status: 200, description: "Class selected and starter pack assigned" })
  @ApiResponse({ status: 400, description: "Invalid class name" })
  @ApiResponse({ status: 404, description: "Character not found" })
  async selectClass(
    @Request() req: { user: { sub: string } },
    @Param("characterId") characterId: string,
    @Body() dto: SelectClassDto,
  ) {
    return this.progressionService.selectClass(req.user.sub, characterId, dto.className);
  }

  @Post(":characterId/select-race")
  @ApiOperation({ summary: "Select a race for a character and apply bonuses" })
  @ApiResponse({ status: 200, description: "Race selected and bonuses applied" })
  @ApiResponse({ status: 400, description: "Invalid race ID" })
  @ApiResponse({ status: 404, description: "Character not found" })
  async selectRace(
    @Request() req: { user: { sub: string } },
    @Param("characterId") characterId: string,
    @Body() dto: SelectRaceDto,
  ) {
    return this.progressionService.selectRace(req.user.sub, characterId, dto.raceId);
  }

  @Post(":characterId/unlock-rank")
  @ApiOperation({ summary: "Unlock a rank in a talent tree (voie)" })
  @ApiResponse({ status: 200, description: "Rank unlocked successfully" })
  @ApiResponse({ status: 400, description: "Not enough talent points or invalid rank" })
  @ApiResponse({ status: 404, description: "Character not found" })
  async unlockRank(
    @Request() req: { user: { sub: string } },
    @Param("characterId") characterId: string,
    @Body() dto: UnlockRankDto,
  ) {
    return this.progressionService.unlockRank(
      req.user.sub,
      characterId,
      dto.voieId,
      dto.rank,
    );
  }
}
