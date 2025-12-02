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
  CombatEndResponseDto,
  CombatStartRequestDto,
  CombatStateDto,
  DiceThrowDto,
  TurnResultWithInstructionsDto,
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

  @Post(':characterId/attack/:actionToken')
  @ApiOperation({ summary: 'Execute player attack in combat' })
  @ApiResponse({
    status: 200,
    type: TurnResultWithInstructionsDto,
  })
  @ApiBody({ type: AttackRequestDto })
  async attack(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
    @Param('actionToken') actionToken: string,
    @Body('targetId') targetId: string,
  ): Promise<TurnResultWithInstructionsDto> {
    const userId = req.user._id.toString();
    return this.combatOrchestrator.processAttack(userId, characterId, actionToken, targetId);
  }

  @Post(':characterId/resolve-roll/:actionToken')
  @ApiOperation({ summary: 'Resolve a client-side roll (damage) and apply its effects' })
  @ApiResponse({
    status: 200,
    type: TurnResultWithInstructionsDto,
  })
  @ApiBody({ type: DiceThrowDto })
  async resolveRoll(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
    @Param('actionToken') actionToken: string,
    @Body() diceThrowDto: DiceThrowDto,
  ) {
    const userId = req.user._id.toString();
    this.logger.debug(`Received resolveRoll request for character ${characterId} with actionToken ${actionToken} and payload ${JSON.stringify(diceThrowDto)}`);
    return this.combatOrchestrator.resolveRoll(userId, characterId, actionToken, diceThrowDto);
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

  @Post(':characterId/end-activation')
  @ApiOperation({ summary: 'End current player activation and advance turn (triggers enemy actions)' })
  @ApiResponse({
    status: 200,
    type: TurnResultWithInstructionsDto,
    description: 'Returns result of enemy actions and new player turn state',
  })
  async endActivation(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ): Promise<TurnResultWithInstructionsDto> {
    const userId = req.user._id.toString();
    return this.combatOrchestrator.endPlayerActivation(userId, characterId);
  }

  @Post(':characterId/end')
  @ApiOperation({ summary: 'Force end current combat (flee)' })
  @ApiResponse({
    status: 200,
    type: CombatEndResponseDto,
  })
  async endCombat(
    @Req() req: RPGRequest,
    @Param('characterId') characterId: string,
  ): Promise<CombatEndResponseDto> {
    const userId = req.user._id.toString();
    return this.combatOrchestrator.endCombat(userId, characterId);
  }
}
