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
import { JwtAuthGuard } from "../../domain/auth/jwt-auth.guard.js";
import type { RPGRequest } from "../../global.types.js";
import { CharacterService } from "../../domain/character/character.service.js";
import { CharacterResponseMapper } from "../../domain/character/character-response.mapper.js";
import { toCharacterResponse } from "./character-response.util.js";
import {
  BaseCharacterResponseDto,
  CharacterResponseDto,
  DraftCharacterResponseDto,
  DeceasedCharacterResponseDto,
  KillCharacterBodyDto,
  UpdateCharacterRequestDto,
} from "../../domain/character/dto/index.js";

@ApiTags("characters")
@Controller("characters")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CharacterController {
  private readonly logger = new Logger(CharacterController.name);

  constructor(
    private characterService: CharacterService,
    private responseMapper: CharacterResponseMapper,
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

    const userId = user._id.toString();
    const character = await this.characterService.create(userId);
    return new DraftCharacterResponseDto(character);
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
    const userId = user._id.toString();

    const characters = await this.characterService.findByUserId(userId);
    return characters.map(c => new BaseCharacterResponseDto(c));
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
    const userId = user._id.toString();

    const characters = await this.characterService.findByUserId(userId);
    return characters
      .filter(c => c.state === 'draft')
      .map(c => new DraftCharacterResponseDto(c));
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
    const userId = user._id.toString();

    const characters = await this.characterService.findByUserId(userId);
    const created = characters.filter(c => c.state === 'created');
    return Promise.all(created.map(c => this.responseMapper.toEnrichedResponse(c)));
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
    const userId = user._id.toString();

    const character = await this.characterService.getDocument(userId, characterId);
    
    this.logger.log('character state', character.state)
    return this.responseMapper.toEnrichedResponse(character);
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
    const userId = user._id.toString();

    const character = await this.characterService.update(userId, characterId, updates);
    this.logger.log('character state', character.state)
    return this.responseMapper.toEnrichedResponse(character);
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
    const userId = user._id.toString();

    await this.characterService.delete(userId, characterId);
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
    const userId = user._id.toString();

    const character = await this.characterService.markAsDeceased(
      userId,
      characterId,
      body.deathLocation,
    );
    return toCharacterResponse(character);
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
    const userId = user._id.toString();

    const characters = await this.characterService.getDeceasedCharacters(userId);
    return characters.map(c => {
      const baseDto = this.characterService.toCharacterDto(c);
      return new DeceasedCharacterResponseDto({
        ...baseDto,
        diedAt: c.diedAt?.toISOString(),
        deathLocation: c.deathLocation,
      });
    });
  }
}
