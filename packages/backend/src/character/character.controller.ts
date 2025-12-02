import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { RPGRequest } from '../global.types.js';
import { CharacterService } from './character.service.js';
import { CreateInventoryItemDto } from './dto/CreateInventoryItemDto.js';
import { EquipInventoryDto } from './dto/EquipInventoryDto.js';
import {
  CharacterResponseDto,
  CreateCharacterBodyDto,
  DeceasedCharacterResponseDto,
  GrantInspirationBodyDto,
  InspirationResponseDto,
  KillCharacterBodyDto,
  RemoveInventoryBodyDto,
  UpdateCharacterRequestDto,
} from './dto/index.js';

@ApiTags('characters')
@Controller('characters')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CharacterController {
  private readonly logger = new Logger(CharacterController.name);

  constructor(private characterService: CharacterService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new character' })
  @ApiBody({ type: CreateCharacterBodyDto })
  @ApiResponse({
    status: 201,
    description: 'Character created successfully',
    type: CharacterResponseDto,
  })
  async create(@Req() req: RPGRequest, @Body('world') world: string) {
    const { user } = req;

    const userId = user._id.toString();
    const character = await this.characterService.create(userId, world);
    return this.characterService.toCharacterDto(character);
  }

  @Get()
  @ApiOperation({ summary: 'Get all characters for the current user' })
  @ApiResponse({
    status: 200,
    description: 'List of characters',
    type: [CharacterResponseDto],
  })
  async findAll(@Req() req: RPGRequest) {
    const { user } = req;
    const userId = user._id.toString();

    const characters = await this.characterService.findByUserId(userId);
    return characters.map(c => this.characterService.toCharacterDto(c));
  }

  @Get('deceased')
  @ApiOperation({ summary: 'Get all deceased characters' })
  @ApiResponse({
    status: 200,
    description: 'List of deceased characters',
    type: [DeceasedCharacterResponseDto],
  })
  async getDeceased(@Req() req: RPGRequest) {
    const { user } = req;
    const userId = user._id.toString();

    const characters = await this.characterService.getDeceasedCharacters(userId);
    return characters.map(c => ({
      ...this.characterService.toCharacterDto(c),
      diedAt: c.diedAt?.toISOString(),
      deathLocation: c.deathLocation,
    }));
  }

  @Get(':characterId')
  @ApiOperation({ summary: 'Get a specific character by ID' })
  @ApiResponse({
    status: 200,
    description: 'Character found',
    type: CharacterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Character not found',
  })
  async findOne(@Req() req: RPGRequest, @Param('characterId') characterId: string) {
    const { user } = req;
    const userId = user._id.toString();

    const character = await this.characterService.findByCharacterId(userId, characterId);
    return character;
  }

  @Put(':characterId')
  @ApiOperation({ summary: 'Update a character' })
  @ApiResponse({
    status: 200,
    description: 'Character updated',
    type: CharacterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Character not found',
  })
  @ApiParam({
    name: 'characterId',
    description: 'ID of the character to update',
  })
  @ApiBody({
    description: 'Fields to update',
    type: UpdateCharacterRequestDto,
  })
  async update(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
    @Body() updates: UpdateCharacterRequestDto,
  ) {
    const { user } = req;
    const userId = user._id.toString();

    const character = await this.characterService.update(userId, characterId, updates);
    return this.characterService.toCharacterDto(character);
  }

  @Delete(':characterId')
  @ApiOperation({ summary: 'Delete a character' })
  @ApiResponse({
    status: 200,
    description: 'Character deleted',
    type: Object,
  })
  @ApiResponse({
    status: 404,
    description: 'Character not found',
  })
  async delete(@Req() req: RPGRequest, @Param('characterId') characterId: string) {
    const { user } = req;
    const userId = user._id.toString();

    await this.characterService.delete(userId, characterId);
    return { ok: true };
  }

  @Post(':characterId/kill')
  @ApiOperation({ summary: 'Mark a character as deceased' })
  @ApiBody({ type: KillCharacterBodyDto })
  @ApiResponse({
    status: 201,
    description: 'Character marked as deceased',
    type: CharacterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Character not found',
  })
  async kill(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
    @Body() body: KillCharacterBodyDto,
  ) {
    const { user } = req;
    const userId = user._id.toString();

    const character = await this.characterService.markAsDeceased(
      userId,
      characterId,
      body.deathLocation,
    );
    return this.characterService.toCharacterDto(character);
  }

  @Post(':characterId/inventory')
  @ApiOperation({ summary: 'Add an item to character\'s inventory' })
  @ApiResponse({
    status: 201,
    description: 'Item added to inventory',
    type: CharacterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Character not found',
  })
  async addInventory(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
    @Body() item: CreateInventoryItemDto,
  ) {
    const { user } = req;
    const userId = user._id.toString();

    const character = await this.characterService.addInventoryItem(userId, characterId, item);
    return this.characterService.toCharacterDto(character);
  }

  @Post(':characterId/inventory/equip')
  @ApiOperation({ summary: 'Equip an item by definitionId (weapon only)' })
  @ApiBody({ type: EquipInventoryDto })
  @ApiResponse({
    status: 200,
    description: 'Character updated with equipped item',
    type: CharacterResponseDto,
  })
  async equipInventory(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
    @Body() body: { definitionId: string },
  ) {
    const { user } = req;
    const userId = user._id.toString();
    const character = await this.characterService.equipInventoryItem(userId, characterId, body.definitionId);
    return character;
  }

  @Patch(':characterId/inventory/:itemId')
  @ApiOperation({ summary: 'Update an item in character\'s inventory' })
  @ApiResponse({
    status: 200,
    description: 'Inventory item updated',
    type: CharacterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Character or item not found',
  })
  @ApiBody({ type: CreateInventoryItemDto })
  async updateInventory(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
    @Param('itemId') itemId: string,
    @Body() updates: CreateInventoryItemDto,
  ) {
    const { user } = req;
    const userId = user._id.toString();

    const character = await this.characterService.updateInventoryItem(userId, characterId, itemId, updates);
    return this.characterService.toCharacterDto(character);
  }

  @Delete(':characterId/inventory/:itemId')
  @ApiOperation({ summary: 'Remove an item from character\'s inventory' })
  @ApiBody({ type: RemoveInventoryBodyDto })
  @ApiResponse({
    status: 200,
    description: 'Item removed from inventory',
    type: CharacterResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Character or item not found',
  })
  async removeInventory(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
    @Param('itemId') itemId: string,
    @Body() body: RemoveInventoryBodyDto,
  ) {
    const { user } = req;
    const userId = user._id.toString();

    const character = await this.characterService.removeInventoryItem(userId, characterId, itemId, body.qty);
    return this.characterService.toCharacterDto(character);
  }

  @Post(':characterId/inspiration/grant')
  @ApiOperation({ summary: 'Grant inspiration point(s) to a character' })
  @ApiBody({ type: GrantInspirationBodyDto })
  @ApiResponse({
    status: 201,
    description: 'Inspiration granted',
    type: InspirationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid amount',
  })
  @ApiResponse({
    status: 404,
    description: 'Character not found',
  })
  async grantInspiration(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
    @Body('amount') amount: number,
  ) {
    const { user } = req;
    const userId = user._id.toString();

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0 || amount > 5) {
      throw new BadRequestException('Amount must be a positive number between 1 and 5');
    }

    const character = await this.characterService.findByCharacterId(userId, characterId);
    // Cap inspiration points at 5 (D&D 5e rule)
    const currentPoints = character.inspirationPoints || 0;
    const newPoints = Math.min(currentPoints + amount, 5);
    const updated = await this.characterService.update(userId, characterId, { inspirationPoints: newPoints });

    return {
      ok: true,
      inspirationPoints: updated.inspirationPoints,
      character: this.characterService.toCharacterDto(updated),
    };
  }

  @Post(':characterId/inspiration/spend')
  @ApiOperation({ summary: 'Spend an inspiration point' })
  @ApiResponse({
    status: 201,
    description: 'Inspiration spent',
    type: InspirationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'No inspiration points available',
  })
  @ApiResponse({
    status: 404,
    description: 'Character not found',
  })
  async spendInspiration(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ) {
    const { user } = req;
    const userId = user._id.toString();

    const character = await this.characterService.findByCharacterId(userId, characterId);
    const currentPoints = character.inspirationPoints || 0;
    if (currentPoints <= 0) {
      throw new BadRequestException('No inspiration points available');
    }

    const updated = await this.characterService.update(userId, characterId, { inspirationPoints: currentPoints - 1 });

    return {
      ok: true,
      inspirationPoints: updated.inspirationPoints,
      character: this.characterService.toCharacterDto(updated),
    };
  }
}
