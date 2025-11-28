import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CharacterService } from '../character/character.service.js';
import { UserDocument } from '../auth/user.schema.js';
import { CombatService } from './combat.service.js';
import { TurnResultWithInstructionsDto, CombatEndResponseDto } from './dto/index.js';
import { CombatStartRequestDto, AttackRequestDto, CombatStateDto } from './dto/index.js';

@ApiTags('combat')
@Controller('combat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CombatController {
  private readonly logger = new Logger(CombatController.name);

  constructor(
    private readonly combatService: CombatService,
    private readonly characterService: CharacterService,
  ) {}

  @Post(':characterId/start')
  @ApiOperation({ summary: 'Initialize combat with enemies' })
  @ApiBody({ type: CombatStartRequestDto })
  @ApiResponse({ status: 201, type: CombatStateDto })
  async startCombat(
    @Req() req: Request,
    @Param('characterId') characterId: string,
    @Body() body: CombatStartRequestDto,
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    this.logger.debug(body);

    const characterDto = await this.characterService.findByCharacterId(userId, characterId);
    const state = await this.combatService.initializeCombat(characterDto, body, userId);

    this.logger.log(`Combat started for character ${characterId} with ${body.combat_start.length} enemies`);

    return {
      characterId: characterId,
      inCombat: true,
      enemies: state.enemies,
      player: state.player,
      turnOrder: state.turnOrder,
      currentTurnIndex: state.currentTurnIndex,
      roundNumber: state.roundNumber,
      narrative: await this.combatService.getCombatSummary(characterId),
    };
  }

  @Post(':characterId/attack')
  @ApiOperation({ summary: 'Execute player attack in combat' })
  @ApiResponse({ status: 200, type: TurnResultWithInstructionsDto })
  @ApiBody({ type: AttackRequestDto })
  // eslint-disable-next-line max-statements
  async attack(
    @Req() req: Request,
    @Param('characterId') characterId: string,
    @Body('target') target: string,
  ): Promise<TurnResultWithInstructionsDto> {
    const user = req.user as UserDocument;
    const userId = user._id.toString();
    // Validate in-combat
    if (!(await this.combatService.isInCombat(characterId))) {
      throw new BadRequestException('Character is not in combat');
    }

    // Get current state
    const state = await this.combatService.getCombatState(characterId);
    if (!state) {
      throw new BadRequestException('No combat state found');
    }

    // Find target enemy
    const targetEnemy = state.enemies.find(e => e.name.toLowerCase() === (target || '').toLowerCase() && e.hp > 0);
    if (!targetEnemy) {
      const validTargets = await this.combatService.getValidTargets(characterId);
      throw new BadRequestException(`Invalid target: ${target}. Valid targets: ${validTargets.join(', ')}`);
    }

    // Build ordered combatants starting from currentTurnIndex
    const ordered = state.turnOrder.map((_, idx) => state.turnOrder[(state.currentTurnIndex + idx) % state.turnOrder.length]);

    const instructions: unknown[] = [];

    // Helper to push a roll instruction with optional conditional index
    const pushRoll = (dices: string, meta: Record<string, unknown>, conditionalOn?: number) => {
      const instr: any = { type: 'roll', dices };
      if (meta) instr.meta = meta;
      if (conditionalOn !== undefined) instr.conditionalOn = conditionalOn;
      instructions.push(instr);
      return instructions.length - 1;
    };

    // Iterate ordered combatants and emit roll instructions only for the player.
    // Enemies will not have their rolls emitted here; the client should only perform player rolls.
    for (const combatant of ordered) {
      if (!combatant.isPlayer) continue;

      // Player attack roll
      const attackIdx = pushRoll('1d20', {
        actor: state.player.name,
        actorId: state.player.characterId,
        action: 'attack',
        target: targetEnemy.name,
        attackBonus: state.player.attackBonus,
        targetAc: targetEnemy.ac,
        // Include damage dice/bonus so frontend can present damage roll details
        damageDice: state.player.damageDice,
        damageBonus: state.player.damageBonus,
      });

      // Only one player exists in turn order, so we can stop after emitting the attack roll.
      // Damage rolls are not emitted here: the client should submit the resolved attack roll
      // result to `POST /api/combat/{characterId}/resolve-roll` which will apply damage server-side
      break;
    }

    // Return a TurnResult-like object with instructions for client to perform rolls in order
    const response: TurnResultWithInstructionsDto = {
      turnNumber: state.currentTurnIndex,
      roundNumber: state.roundNumber,
      playerAttacks: [],
      enemyAttacks: [],
      combatEnded: false,
      victory: false,
      defeat: false,
      remainingEnemies: state.enemies,
      playerHp: state.player.hp,
      playerHpMax: state.player.hpMax,
      narrative: 'Perform the attack roll. If the attack hits, submit damage via POST /api/combat/{characterId}/resolve-roll',
      instructions,
    };

    return response;
  }

  @Post(':characterId/resolve-roll')
  @ApiOperation({ summary: 'Resolve a client-side roll (damage) and apply its effects' })
  @ApiResponse({ status: 200, type: TurnResultWithInstructionsDto })
  async resolveRoll(
    @Req() req: Request,
    @Param('characterId') characterId: string,
    @Body() body: { action: string; target?: string; total?: number },
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    if (!body || body.action !== 'damage' || typeof body.total !== 'number' || !body.target) {
      throw new BadRequestException('Invalid roll resolution payload');
    }

    if (!(await this.combatService.isInCombat(characterId))) {
      throw new BadRequestException('Character is not in combat');
    }

    const result = await this.combatService.applyDamageToEnemy(characterId, body.target, body.total);
    if (!result) throw new BadRequestException('Failed to apply damage');
    return result;
  }

  @Get(':characterId/status')
  @ApiOperation({ summary: 'Get current combat status' })
  @ApiResponse({ status: 200, type: CombatStateDto })
  async getStatus(
    @Req() req: Request,
    @Param('characterId') characterId: string,
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    // Verify character ownership
    const character = await this.characterService.findByCharacterId(userId, characterId);

    const inCombat = await this.combatService.isInCombat(characterId);
    if (!inCombat) {
      return {
        inCombat: false,
        narrative: 'Aucun combat en cours.',
      };
    }

    const state = await this.combatService.getCombatState(characterId);
    if (!state) {
      return {
        inCombat: false,
        narrative: 'Aucun combat en cours.',
      };
    }

    return {
      characterId: characterId,
      inCombat: true,
      enemies: state.enemies.filter(e => e.hp > 0),
      player: state.player,
      turnOrder: state.turnOrder,
      currentTurnIndex: state.currentTurnIndex,
      roundNumber: state.roundNumber,
      validTargets: await this.combatService.getValidTargets(characterId),
      narrative: await this.combatService.getCombatSummary(characterId),
    };
  }

  @Post(':characterId/end')
  @ApiOperation({ summary: 'Force end current combat (flee)' })
  @ApiResponse({ status: 200, type: CombatEndResponseDto })
  async endCombat(
    @Req() req: Request,
    @Param('characterId') characterId: string,
  ): Promise<CombatEndResponseDto> {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    // Verify character ownership
    const character = await this.characterService.findByCharacterId(userId, characterId);
    if (!character) {
      throw new BadRequestException('Character not found');
    }

    if (!(await this.combatService.isInCombat(characterId))) {
      return {
        success: false,
        message: 'Aucun combat en cours.',
      };
    }

    await this.combatService.endCombat(characterId);
    this.logger.log(`Combat forcefully ended for ${characterId}`);

    return {
      success: true,
      message: 'Vous avez fui le combat.',
      instructions: [{
        combat_end: {
          victory: false,
          xp_gained: 0,
          player_hp: character.hp!,
          enemies_defeated: [],
          fled: true,
          narrative: 'Vous avez fui le combat.',
        },
      }],
    };
  }
}
