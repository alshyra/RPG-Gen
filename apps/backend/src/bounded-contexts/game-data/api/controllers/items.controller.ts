import { Controller, Get, Logger, Param, NotFoundException, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ItemDataService } from '../../application/services/ItemDataService.js';
import { ItemResponseDto } from '../dto/index.js';
import { ItemResponseMapper } from '../dto/ItemResponseMapper.js';

@ApiTags('items')
@Controller('items')
export class ItemsController {
  private readonly logger = new Logger(ItemsController.name);

  constructor(private readonly itemService: ItemDataService) {}

  @Get()
  @ApiOperation({ summary: 'Get all item definitions' })
  @ApiResponse({
    status: 200,
    description: 'List of all items',
    type: [ItemResponseDto],
  })
  async getAllItems(): Promise<ItemResponseDto[]> {
    const items = await this.itemService.findAll();
    return items.map(item => ItemResponseMapper.toDto(item));
  }

  @Get('weapons')
  @ApiOperation({ summary: 'Get all weapon definitions' })
  @ApiResponse({
    status: 200,
    description: 'List of all weapons',
    type: [ItemResponseDto],
  })
  async getWeapons(): Promise<ItemResponseDto[]> {
    const items = await this.itemService.findByType('weapon');
    return items.map(item => ItemResponseMapper.toDto(item));
  }

  @Get('armors')
  @ApiOperation({ summary: 'Get all armor definitions' })
  @ApiResponse({
    status: 200,
    description: 'List of all armor',
    type: [ItemResponseDto],
  })
  async getArmors(): Promise<ItemResponseDto[]> {
    const items = await this.itemService.findByType('armor');
    return items.map(item => ItemResponseMapper.toDto(item));
  }

  @Get('consumables')
  @ApiOperation({ summary: 'Get all consumable definitions' })
  @ApiResponse({
    status: 200,
    description: 'List of all consumables',
    type: [ItemResponseDto],
  })
  async getConsumables(): Promise<ItemResponseDto[]> {
    const items = await this.itemService.findByType('consumable');
    return items.map(item => ItemResponseMapper.toDto(item));
  }

  @Get('starters')
  @ApiOperation({ summary: 'Get all starter items' })
  @ApiResponse({
    status: 200,
    description: 'List of starter items for new characters',
    type: [ItemResponseDto],
  })
  async getStarterItems(): Promise<ItemResponseDto[]> {
    const items = await this.itemService.findStarters();
    return items.map(item => ItemResponseMapper.toDto(item));
  }

  @Get('by-ids')
  @ApiOperation({ summary: 'Get multiple items by IDs' })
  @ApiQuery({
    name: 'ids',
    description: 'Comma-separated item definition IDs',
    example: 'epee_longue,bouclier_bois',
  })
  @ApiResponse({
    status: 200,
    description: 'List of matching items',
    type: [ItemResponseDto],
  })
  async getByIds(@Query('ids') ids: string): Promise<ItemResponseDto[]> {
    const idList = ids.split(',').map(id => id.trim()).filter(Boolean);
    const items = await this.itemService.findByIds(idList);
    return items.map(item => ItemResponseMapper.toDto(item));
  }

  @Get(':definitionId')
  @ApiOperation({ summary: 'Get an item by definition ID' })
  @ApiParam({
    name: 'definitionId',
    description: 'Item definition identifier',
  })
  @ApiResponse({
    status: 200,
    description: 'Item details',
    type: ItemResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Item not found' })
  async getItem(@Param('definitionId') definitionId: string): Promise<ItemResponseDto> {
    const item = await this.itemService.findById(definitionId);
    if (!item) {
      throw new NotFoundException(`Item '${definitionId}' not found`);
    }
    return ItemResponseMapper.toDto(item);
  }
}
