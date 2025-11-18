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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CharacterDto } from '@rpg/shared';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Character } from '../schemas/character.schema';
import { UserDocument } from '../schemas/user.schema';
import { CharacterService } from './character.service';

@ApiTags('characters')
@Controller('characters')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CharacterController {
  private readonly logger = new Logger(CharacterController.name);

  constructor(private characterService: CharacterService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new character' })
  async create(@Req() req: Request, @Body() characterData: Character) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    const character = await this.characterService.create(userId, characterData);
    return this.characterService.toCharacterDto(character) as CharacterDto;
  }

  @Get()
  @ApiOperation({ summary: 'Get all characters for the current user' })
  async findAll(@Req() req: Request) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    const characters = await this.characterService.findByUserId(userId);
    return characters.map(this.characterService.toCharacterDto, this.characterService) as CharacterDto[];
  }

  @Get('deceased')
  @ApiOperation({ summary: 'Get all deceased characters' })
  async getDeceased(@Req() req: Request) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    const characters = await this.characterService.getDeceasedCharacters(userId);
    // toCharacterDto already converts dates -> ISO strings; keep shapes consistent
    return characters.map(c => ({ ...this.characterService.toCharacterDto(c) }));
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
      character: this.characterService.toCharacterDto(character) as CharacterDto,
    };
  }

  @Put(':characterId')
  @ApiOperation({ summary: 'Update a character' })
  async update(
    @Req() req: Request,
    @Param('characterId') characterId: string,
    @Body() updates: Partial<Character>,
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    const character = await this.characterService.update(userId, characterId, updates);
    return {
      ok: true,
      character: this.characterService.toCharacterDto(character) as CharacterDto,
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
    return this.characterService.toCharacterDto(character) as CharacterDto;
  }
}
