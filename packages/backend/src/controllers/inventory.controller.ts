import {
  Body,
  Controller,
  Logger,
  Param,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../domain/auth/jwt-auth.guard.js';
import type { RPGRequest } from '../global.types.js';
import { ItemOrchestrator } from '../orchestrators/item/index.js';
import { UseItemRequestDto, UseItemResponseDto } from '../domain/item-definition/dto/index.js';

@ApiTags('inventory')
@Controller('characters/:characterId/inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  private readonly logger = new Logger(InventoryController.name);

  constructor(private readonly itemOrchestrator: ItemOrchestrator) {}

  @Post('use')
  @ApiOperation({ summary: 'Use an item from inventory' })
  @ApiParam({
    name: 'characterId',
    description: 'Character ID',
  })
  @ApiBody({ type: UseItemRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Item used successfully',
    type: UseItemResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request (item not found, wrong context, etc.)',
  })
  async useItem(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
    @Body() body: UseItemRequestDto,
  ): Promise<UseItemResponseDto> {
    const userId = req.user.userId || req.user.id;
    this.logger.log(`User ${userId} using item ${body.itemId} for character ${characterId}`);
    return this.itemOrchestrator.useItem(userId, characterId, body.itemId);
  }
}
