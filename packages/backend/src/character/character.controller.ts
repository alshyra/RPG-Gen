import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { CharacterService } from './character.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UserDocument } from '../schemas/user.schema.js';
import type { CharacterDto } from '@rpg-gen/shared';

@ApiTags('characters')
@Controller('characters')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CharacterController {
  private readonly logger = new Logger(CharacterController.name);

  constructor(private characterService: CharacterService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new character' })
  async create(@Req() req: Request, @Body() characterData: CharacterDto) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    if (!characterData.characterId) {
      throw new BadRequestException('Character must have an id');
    }

    const character = await this.characterService.create(userId, characterData);
    return this.characterService.toCharacterDto(character);
  }

  @Get()
  @ApiOperation({ summary: 'Get all characters for the current user' })
  async findAll(@Req() req: Request) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    const characters = await this.characterService.findByUserId(userId);
    return {
      ok: true,
      characters: characters.map(c => this.characterService.toCharacterDto(c)),
    };
  }

  @Get('deceased')
  @ApiOperation({ summary: 'Get all deceased characters' })
  async getDeceased(@Req() req: Request) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    const characters = await this.characterService.getDeceasedCharacters(userId);
    return {
      ok: true,
      characters: characters.map(c => ({
        ...this.characterService.toCharacterDto(c),
        diedAt: c.diedAt?.toISOString(),
        deathLocation: c.deathLocation,
      })),
    };
  }

  @Get(':characterId')
  @ApiOperation({ summary: 'Get a specific character by ID' })
  async findOne(@Req() req: Request, @Param('characterId') characterId: string) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    const character = await this.characterService.findByCharacterId(userId, characterId);
    if (!character) {
      return { ok: false, message: 'Character not found' };
    }

    return {
      ok: true,
      character: this.characterService.toCharacterDto(character),
    };
  }

  @Put(':characterId')
  @ApiOperation({ summary: 'Update a character' })
  async update(
    @Req() req: Request,
    @Param('characterId') characterId: string,
    @Body() updates: Partial<CharacterDto>,
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    const character = await this.characterService.update(userId, characterId, updates);
    return {
      ok: true,
      character: this.characterService.toCharacterDto(character),
    };
  }

  @Delete(':characterId')
  @ApiOperation({ summary: 'Delete a character' })
  async delete(@Req() req: Request, @Param('characterId') characterId: string) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    await this.characterService.delete(userId, characterId);
    return { ok: true, message: 'Character deleted' };
  }

  @Post(':characterId/kill')
  @ApiOperation({ summary: 'Mark a character as deceased' })
  async kill(
    @Req() req: Request,
    @Param('characterId') characterId: string,
    @Body() body: { deathLocation?: string },
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    const character = await this.characterService.markAsDeceased(
      userId,
      characterId,
      body.deathLocation,
    );
    return {
      ok: true,
      character: this.characterService.toCharacterDto(character),
    };
  }
}
