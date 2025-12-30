import { Body, Controller, Get, Logger, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../../auth/infrastructure/auth/guards/JwtAuthGuard.js";
import {
  CombatActionRequestDto,
  CombatActionResponseDto,
  CombatEndResponseDto,
  CombatStartRequestDto,
  CombatStateDto,
  EndPlayerTurnResponseDto,
  MovementRequestDto,
  MovementResponseDto,
} from "../dto/response/index.js";
import type { RPGRequest } from "../../../../global.types.js";
import { CombatOrchestrator, CombatMovementOrchestrator, CombatActionOrchestrator } from "../../../../workflows/combat-gameplay/index.js";
import { ChatOrchestrator } from "../../../../workflows/index.js";

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
@ApiTags("combat")
@Controller("combat")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CombatController {
  private readonly logger = new Logger(CombatController.name);

  constructor(
    private readonly combatOrchestrator: CombatOrchestrator,
    private readonly movementOrchestrator: CombatMovementOrchestrator,
    private readonly actionOrchestrator: CombatActionOrchestrator,
    private readonly chatOrchestrator: ChatOrchestrator,
  ) {}

  @Post(":characterId/start")
  @ApiOperation({ summary: "Initialize combat with enemies" })
  @ApiBody({ type: CombatStartRequestDto })
  @ApiResponse({
    status: 201,
    type: CombatStateDto,
  })
  async startCombat(
    @Req() req: RPGRequest,
    @Param("characterId") characterId: string,
    @Body() body: CombatStartRequestDto,
  ) {
    const userId = req.user.id;
    this.logger.debug(body);
    return this.combatOrchestrator.startCombat(userId, characterId, body);
  }

  @Post(":characterId/action")
  @ApiOperation({
    summary: "Execute any combat action (attack, dash, disengage, spell, class feature)",
  })
  @ApiResponse({
    status: 200,
    type: CombatActionResponseDto,
  })
  @ApiBody({ type: CombatActionRequestDto })
  async action(
    @Req() req: RPGRequest,
    @Param("characterId") characterId: string,
    @Body() body: CombatActionRequestDto,
  ): Promise<CombatActionResponseDto> {
    const userId = req.user.id;
    return this.actionOrchestrator.executeAction(userId, characterId, body);
  }

  @Get(":characterId/status")
  @ApiOperation({ summary: "Get current combat status" })
  @ApiResponse({
    status: 200,
    type: CombatStateDto,
    description: "Returns combat state or inCombat: false if no active combat",
  })
  async getStatus(@Req() req: RPGRequest, @Param("characterId") characterId: string) {
    const userId = req.user.id;
    const status = await this.combatOrchestrator.getStatus(userId, characterId);
    
    // If no combat session exists, return a minimal response indicating no combat
    if (!status) {
      return new CombatStateDto({
        characterId,
        inCombat: false,
        enemies: [],
        turnOrder: [],
        currentTurnIndex: 0,
        roundNumber: 0,
      });
    }
    
    return status;
  }

  @Post(":characterId/end-turn")
  @ApiOperation({
    summary: "End current player activation and advance turn (triggers enemy actions)",
  })
  @ApiResponse({
    status: 200,
    type: EndPlayerTurnResponseDto,
    description: "Returns attack logs for animations and new player turn state",
  })
  async endTurn(
    @Req() req: RPGRequest,
    @Param("characterId") characterId: string,
  ): Promise<EndPlayerTurnResponseDto> {
    const userId = req.user.id;
    return this.combatOrchestrator.endPlayerTurn(userId, characterId);
  }

  @Post(":characterId/flee")
  @ApiOperation({ summary: "Force end current combat (flee)" })
  @ApiResponse({
    status: 200,
    type: CombatEndResponseDto,
  })
  async flee(
    @Req() req: RPGRequest,
    @Param("characterId") characterId: string,
  ): Promise<CombatEndResponseDto> {
    const userId = req.user.id;
    return this.combatOrchestrator.endCombat(userId, characterId);
  }

  @Post(":characterId/move")
  @ApiOperation({ summary: "Execute combatant movement on the grid" })
  @ApiBody({ type: MovementRequestDto })
  @ApiResponse({
    status: 200,
    type: MovementResponseDto,
  })
  async move(
    @Req() req: RPGRequest,
    @Param("characterId") characterId: string,
    @Body() body: MovementRequestDto,
  ): Promise<MovementResponseDto> {
    const userId = req.user.id;
    return this.movementOrchestrator.executeMovement(userId, characterId, body);
  }
}
