import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../domain/auth/jwt-auth.guard.js';
import {
  AttackRequestDto,
  AttackResponseDto,
  CombatEndResponseDto,
  CombatStartRequestDto,
  CombatStateDto,
  EndPlayerTurnResponseDto,
} from '../domain/combat/dto/index.js';
import type { RPGRequest } from '../global.types.js';
import { CombatOrchestrator } from '../orchestrators/combat/index.js';

/**
 * CombatController - Thin controller that delegates to CombatOrchestrator.
 *
 * Following the orchestrator pattern, this controller:
 * - Extracts request parameters and user context
 * - Delegates all business logic to CombatOrchestrator
 * - Returns the orchestrator's response
 *
 * No direct calls to domain services (CombatService, CharacterService, etc.)
 */
@ApiTags('combat')
@Controller('combat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CombatController {
  private readonly logger = new Logger(CombatController.name);

  constructor(
    private readonly combatOrchestrator: CombatOrchestrator,
  ) {}

  @Post(':characterId/start')
  @ApiOperation({ summary: 'Initialize combat with enemies' })
  @ApiBody({ type: CombatStartRequestDto })
  @ApiResponse({
    status: 201,
    type: CombatStateDto,
  })
  async startCombat(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
    @Body() body: CombatStartRequestDto,
  ) {
    const userId = req.user._id.toString();
    this.logger.debug(body);
    return this.combatOrchestrator.startCombat(userId, characterId, body);
  }

  @Post(':characterId/attack')
  @ApiOperation({ summary: 'Execute player attack in combat, determine if player hit his target' })
  @ApiResponse({
    status: 200,
    type: AttackResponseDto,
  })
  @ApiBody({ type: AttackRequestDto })
  async attack(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
    @Body('targetId') targetId: string,
  ): Promise<AttackResponseDto> {
    const userId = req.user._id.toString();
    return this.combatOrchestrator.processAttack(userId, characterId, targetId);
  }

  @Get(':characterId/status')
  @ApiOperation({ summary: 'Get current combat status' })
  @ApiResponse({
    status: 200,
    type: CombatStateDto,
  })
  async getStatus(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ) {
    const userId = req.user._id.toString();
    return this.combatOrchestrator.getStatus(userId, characterId);
  }

  @Post(':characterId/end-turn')
  @ApiOperation({ summary: 'End current player activation and advance turn (triggers enemy actions)' })
  @ApiResponse({
    status: 200,
    type: EndPlayerTurnResponseDto,
    description: 'Returns attack logs for animations and new player turn state',
  })
  async endTurn(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ): Promise<EndPlayerTurnResponseDto> {
    const userId = req.user._id.toString();
    return this.combatOrchestrator.endPlayerTurn(userId, characterId);
  }

  @Post(':characterId/flee')
  @ApiOperation({ summary: 'Force end current combat (flee)' })
  @ApiResponse({
    status: 200,
    type: CombatEndResponseDto,
  })
  async flee(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ): Promise<CombatEndResponseDto> {
    const userId = req.user._id.toString();
    return this.combatOrchestrator.endCombat(userId, characterId);
  }
}
