import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../auth/infrastructure/auth/guards/JwtAuthGuard.js";
import type { RPGRequest } from "../../../../global.types.js";
import { CharacterAppService } from "../../application/services/CharacterAppService.js";
import { CharacterDtoMapper } from "../dto/mappers/CharacterDtoMapper.js";
import {
  CharacterResponseDto,
  DraftCharacterResponseDto,
  DeceasedCharacterResponseDto,
} from "../dto/response/index.js";
import { KillCharacterBodyDto, UpdateCharacterRequestDto } from "../dto/request/index.js";

@ApiTags("characters")
@Controller("characters")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CharacterController {
  private readonly logger = new Logger(CharacterController.name);

  constructor(
    private characterAppService: CharacterAppService,
    private dtoMapper: CharacterDtoMapper,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new character" })
  @ApiResponse({
    status: 201,
    description: "Character created successfully",
    type: DraftCharacterResponseDto,
  })
  async create(@Req() req: RPGRequest) {
    const { user } = req;

    const userId = user.id;
    const characterId = this.characterAppService.generateCharacterId();
    const character = await this.characterAppService.createDraft({ characterId, userId });
    return CharacterDtoMapper.toDto(character);
  }

  @Get()
  @ApiOperation({ summary: "Get all characters for the current user" })
  @ApiResponse({
    status: 200,
    description: "List of characters",
    type: [CharacterResponseDto],
  })
  async findAll(@Req() req: RPGRequest) {
    const { user } = req;
    const userId = user.id;

    const characters = await this.characterAppService.findByUserId(userId);
    return characters.map(c => CharacterDtoMapper.toDto(c));
  }

  @Get("drafts/list")
  @ApiOperation({ summary: "Get all draft (unfinished) characters for the current user" })
  @ApiResponse({
    status: 200,
    description: "List of draft characters",
    type: [DraftCharacterResponseDto],
  })
  async findDrafts(@Req() req: RPGRequest) {
    const { user } = req;
    const userId = user.id;

    const characters = await this.characterAppService.findDraftsByUserId(userId);
    return characters.map(c => CharacterDtoMapper.toDto(c));
  }

  @Get("created/list")
  @ApiOperation({ summary: "Get all finished characters for the current user" })
  @ApiResponse({
    status: 200,
    description: "List of finished characters",
    type: [CharacterResponseDto],
  })
  async findCreated(@Req() req: RPGRequest) {
    const { user } = req;
    const userId = user.id;

    const characters = await this.characterAppService.findCompletedByUserId(userId);
    return Promise.all(characters.map(c => this.dtoMapper.toEnrichedDto(c)));
  }

  @Get(":characterId")
  @ApiOperation({ summary: "Get a specific character by ID" })
  @ApiResponse({
    status: 200,
    description: "Character found",
    type: CharacterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Character not found",
  })
  async findOne(@Req() req: RPGRequest, @Param("characterId") characterId: string) {
    const { user } = req;
    const userId = user.id;

    const character = await this.characterAppService.findByUserAndId(userId, characterId);
    
    this.logger.log('character state', character.state)
    return this.dtoMapper.toEnrichedDto(character);
  }

  @Put(":characterId")
  @ApiOperation({ summary: "Update a character" })
  @ApiResponse({
    status: 200,
    description: "Character updated",
    type: CharacterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Character not found",
  })
  @ApiParam({
    name: "characterId",
    description: "ID of the character to update",
  })
  @ApiBody({
    description: "Fields to update",
    type: UpdateCharacterRequestDto,
  })
  async update(
    @Req() req: RPGRequest,
    @Param("characterId") characterId: string,
    @Body() updates: UpdateCharacterRequestDto,
  ) {
    const { user } = req;
    const userId = user.id;

    const character = await this.characterAppService.update(userId, characterId, updates);
    this.logger.log('character state', character.state)
    return this.dtoMapper.toEnrichedDto(character);
  }

  @Delete(":characterId")
  @ApiOperation({ summary: "Delete a character" })
  @ApiResponse({
    status: 200,
    description: "Character deleted",
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: "Character not found",
  })
  async delete(@Req() req: RPGRequest, @Param("characterId") characterId: string) {
    const { user } = req;
    const userId = user.id;

    await this.characterAppService.delete(userId, characterId);
    return { ok: true };
  }

  @Post(":characterId/kill")
  @ApiOperation({ summary: "Mark a character as deceased" })
  @ApiBody({ type: KillCharacterBodyDto })
  @ApiResponse({
    status: 201,
    description: "Character marked as deceased",
    type: CharacterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Character not found",
  })
  async kill(
    @Req() req: RPGRequest,
    @Param("characterId") characterId: string,
    @Body() body: KillCharacterBodyDto,
  ) {
    const { user } = req;
    const userId = user.id;

    const character = await this.characterAppService.markAsDeceased(
      userId,
      characterId,
      body.deathLocation,
    );
    return CharacterDtoMapper.toDto(character);
  }

  @Get("deceased")
  @ApiOperation({ summary: "Get all deceased characters" })
  @ApiResponse({
    status: 200,
    description: "List of deceased characters",
    type: [DeceasedCharacterResponseDto],
  })
  async getDeceased(@Req() req: RPGRequest) {
    const { user } = req;
    const userId = user.id;

    const characters = await this.characterAppService.findDeceasedByUserId(userId);
    return characters.map(c => {
      const baseDto = CharacterDtoMapper.toDto(c);
      return new DeceasedCharacterResponseDto({
        ...baseDto,
        diedAt: c.diedAt?.toISOString(),
        deathLocation: c.deathLocation,
      });
    });
  }
}
