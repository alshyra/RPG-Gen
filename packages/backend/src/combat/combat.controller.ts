import {
  BadRequestException,
  Body,
  Controller,
  ConflictException,
  Get,
  Logger,
  Param,
  Post,
  Req,
  UseGuards,
  GoneException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CharacterService } from '../character/character.service.js';
import { UserDocument } from '../auth/user.schema.js';
import { CombatService } from './combat.service.js';

import { ActionRecordService } from './action-record.service.js';
import { ActionRecord, ActionStatus } from './action-record.schema.js';
import { TurnResultWithInstructionsDto, CombatEndResponseDto, DiceThrowDto } from './dto/index.js';
import { DiceController } from '../dice/dice.controller.js';
import { CombatStartRequestDto, AttackRequestDto, CombatStateDto, CombatEnemyDto } from './dto/index.js';

@ApiTags('combat')
@Controller('combat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CombatController {
  private readonly logger = new Logger(CombatController.name);

  constructor(
    private readonly combatService: CombatService,
    private readonly characterService: CharacterService,
    private readonly actionRecordService: ActionRecordService,
  ) {}

  private async acquireActionToken(actionToken: string, userId: string, combatId: string, expectedDto: string) {
    // Ensure token exists (tokens are issued by server in prompts). If missing, treat as expired/unknown => 410
    const exists = await this.actionRecordService.getByToken(actionToken);
    if (!exists) throw new GoneException('Action token not found or expired');

    const acquire = await this.actionRecordService.tryAcquire(actionToken, {
      requesterId: userId,
      combatId,
      expectedDto,
      idempotencyKey: undefined,
    });

    if (!acquire.acquired) {
      const record = acquire.record as ActionRecord | null;
      if (record && String(record.requesterId) !== userId) {
        throw new ConflictException('Action token already consumed by another requester');
      }
      if (record && record.status === ActionStatus.APPLIED) {
        return { alreadyApplied: true, record } as const;
      }
      throw new BadRequestException('Unable to acquire action token');
    }

    return { alreadyApplied: false, record: acquire.record as ActionRecord } as const;
  }

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

    // Generate an action token for the first player action
    const actionToken = await this.actionRecordService.generateToken({
      requesterId: userId,
      combatId: characterId,
      expectedDto: 'AttackRequestDto',
    });

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
      phase: 'PLAYER_TURN' as const,
      actionToken,
      expectedDto: 'AttackRequestDto',
    };
  }

  @Post(':characterId/attack/:actionToken')
  @ApiOperation({ summary: 'Execute player attack in combat' })
  @ApiResponse({ status: 200, type: TurnResultWithInstructionsDto })
  @ApiBody({ type: AttackRequestDto })
  // eslint-disable-next-line max-statements
  async attack(
    @Req() req: Request,
    @Param('characterId') characterId: string,
    @Param('actionToken') actionToken: string,
    @Body('target') target: string,
  ): Promise<TurnResultWithInstructionsDto> {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    if (!(await this.combatService.isInCombat(characterId))) {
      throw new BadRequestException('Character is not in combat');
    }

    const acquired = await this.acquireActionToken(actionToken, userId, characterId, 'AttackRequestDto');
    if (acquired.alreadyApplied) {
      return (acquired.record).resultPayload as TurnResultWithInstructionsDto;
    }

    const state = await this.combatService.getCombatState(characterId);
    if (!state) {
      await this.actionRecordService.setFailed(actionToken, { error: 'No combat state found' });
      throw new BadRequestException('No combat state found');
    }

    const targetEnemy = state.enemies.find(e => e.name.toLowerCase() === (target || '').toLowerCase() && e.hp > 0);
    if (!targetEnemy) {
      const validTargets = await this.combatService.getValidTargets(characterId);
      await this.actionRecordService.setFailed(actionToken, { error: 'Invalid target' });
      throw new BadRequestException(`Invalid target: ${target}. Valid targets: ${validTargets.join(', ')}`);
    }

    // Server-side attack roll (phase 2.b): resolve the d20 attack roll here
    const dice = new DiceController();
    const attackRoll = dice.rollDiceExpr('1d20');
    const die = attackRoll.rolls[0];
    const totalAttack = die + (state.player.attackBonus || 0);
    const critical = die === 20;
    const fumble = die === 1;
    const hit = critical || (typeof targetEnemy.ac === 'number' ? (totalAttack >= targetEnemy.ac && !fumble) : false);

    if (!hit) {
      // Miss: apply miss effects and advance turn (no damage). This is a final result for the sequence.
      const res = await this.combatService.applyDamageToEnemy(characterId, targetEnemy.name, 0);
      if (!res) {
        await this.actionRecordService.setFailed(actionToken, { error: 'Failed to advance turn after miss' });
        throw new BadRequestException('Failed to advance turn after miss');
      }
      await this.actionRecordService.setApplied(actionToken, res, { requesterId: userId });
      return res;
    }

    // Hit: instruct client to roll damage. Persist partial attack info and set expectedDto to DiceThrowDto
    const instructions: Array<Record<string, unknown>> = [{
      type: 'roll',
      dices: state.player.damageDice || '1d4',
      modifier: state.player.damageBonus || 0,
      meta: {
        action: 'damage',
        target: targetEnemy.name,
        damageBonus: state.player.damageBonus || 0,
      },
      description: `Damage to ${targetEnemy.name}`,
    } as Record<string, unknown>];

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
      narrative: `Attaque réussie (${die} + ${state.player.attackBonus || 0} = ${totalAttack} vs AC ${targetEnemy.ac}). Lancez les dégâts avec POST /api/combat/${characterId}/resolve-roll/${actionToken}`,
      instructions,
    };

    // Persist partial attack info and mark the record to expect DiceThrowDto next
    const partial = { attackRoll: die, attackBonus: state.player.attackBonus, totalAttack, targetAc: targetEnemy.ac, hit: true, critical, fumble };
    await this.actionRecordService.setPendingWithExpected(actionToken, 'DiceThrowDto', partial, { requesterId: userId });

    return response;
  }

  /* eslint-disable max-statements */
  @Post(':characterId/resolve-roll/:actionToken')
  @ApiOperation({ summary: 'Resolve a client-side roll (damage) and apply its effects' })
  @ApiResponse({ status: 200, type: TurnResultWithInstructionsDto })
  @ApiBody({ type: DiceThrowDto })
  async resolveRoll(
    @Req() req: Request,
    @Param('characterId') characterId: string,
    @Param('actionToken') actionToken: string,
    @Body() body: DiceThrowDto,
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    if (!body || !body.action) {
      throw new BadRequestException('Invalid roll resolution payload');
    }

    if (!(await this.combatService.isInCombat(characterId))) {
      throw new BadRequestException('Character is not in combat');
    }

    await this.characterService.findByCharacterId(userId, characterId);

    // Load existing record (must exist and be awaiting DiceThrowDto)
    const existing = await this.actionRecordService.getByToken(actionToken);
    if (!existing) throw new GoneException('Action token not found or expired');
    if (String(existing.requesterId) !== userId) throw new ConflictException('Action token consumed by another requester');
    if (existing.status === ActionStatus.APPLIED) return (existing).resultPayload as TurnResultWithInstructionsDto;
    if (existing.expectedDto !== 'DiceThrowDto') throw new BadRequestException('This action token is not awaiting a dice throw');

    // Now acquire (lock) atomically before processing
    const acquired = await this.actionRecordService.tryAcquire(actionToken, { requesterId: userId, combatId: characterId, expectedDto: 'DiceThrowDto' });
    if (!acquired.acquired) {
      // Another worker may be processing; if applied return result, else conflict
      const rec = acquired.record as ActionRecord | null;
      if (rec && rec.status === ActionStatus.APPLIED) return rec.resultPayload as TurnResultWithInstructionsDto;
      throw new ConflictException('Unable to acquire action token for processing');
    }

    try {
      if (body.action !== 'damage') {
        throw new BadRequestException('resolve-roll expects action = "damage" in this flow');
      }

      // Validate partial attack info exists and indicates a hit
      const partial = existing.resultPayload as { hit?: boolean } | undefined;
      if (!partial || !partial.hit) {
        throw new BadRequestException('No pending successful attack associated with this token');
      }

      // Apply damage and persist final state
      const result = await this.combatService.applyDamageToEnemy(characterId, body.target!, body.total!);
      if (!result) throw new BadRequestException('Failed to apply damage');

      await this.actionRecordService.setApplied(actionToken, result, { requesterId: userId });
      return result;
    } catch (err) {
      await this.actionRecordService.setFailed(actionToken, { error: String(err) });
      throw err;
    }
  }
  /* eslint-enable max-statements */

  private async handleAttackResolution(characterId: string, body: { action: string; target?: string; total?: number; die?: number }) {
    if (typeof body.total !== 'number' || !body.target) {
      throw new BadRequestException('Invalid attack resolution payload');
    }

    const state = await this.combatService.getCombatState(characterId);
    if (!state) throw new BadRequestException('No combat state');

    const targetEnemy = state.enemies.find(e => e.name.toLowerCase() === (body.target || '').toLowerCase());
    if (!targetEnemy) throw new BadRequestException('Invalid target for attack resolution');

    const attackTotal = Math.floor(body.total);
    const die = typeof body.die === 'number' ? Math.floor(body.die) : undefined;
    const critical = die === 20;
    const fumble = die === 1;
    const hit = critical || (typeof targetEnemy.ac === 'number' ? (attackTotal >= targetEnemy.ac && !fumble) : false);

    if (hit) return this.buildHitResponse(state, targetEnemy, attackTotal, critical);

    const res = await this.combatService.applyDamageToEnemy(characterId, body.target, 0);
    if (!res) throw new BadRequestException('Failed to advance turn after miss');
    return res;
  }

  private buildHitResponse(state: CombatStateDto, targetEnemy: CombatEnemyDto, attackTotal: number, critical: boolean): TurnResultWithInstructionsDto {
    const critText = critical ? ' (Coup critique !)' : '';
    return {
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
      narrative: `Attaque touchée contre ${targetEnemy.name} (${attackTotal} ≥ ${targetEnemy.ac})${critText}. Lancez les dégâts.`,
      instructions: [{
        type: 'roll',
        dices: state.player.damageDice || '1d4',
        modifier: state.player.damageBonus || 0,
        meta: {
          action: 'damage',
          target: targetEnemy.name,
          damageBonus: state.player.damageBonus || 0,
        },
        description: `Damage to ${targetEnemy.name}`,
      }],
    };
  }

  private async handleDamageResolution(characterId: string, body: { action: string; target?: string; total?: number; die?: number }) {
    if (typeof body.total !== 'number' || !body.target) {
      throw new BadRequestException('Invalid damage resolution payload');
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

    await this.characterService.findByCharacterId(userId, characterId);

    const inCombat = await this.combatService.isInCombat(characterId);
    if (!inCombat) {
      return {
        characterId,
        inCombat: false,
        narrative: 'Aucun combat en cours.',
      };
    }

    const state = await this.combatService.getCombatState(characterId);
    if (!state) {
      return {
        characterId,
        inCombat: false,
        narrative: 'Aucun combat en cours.',
      };
    }

    // Generate a fresh action token for the player's next action
    const actionToken = await this.actionRecordService.generateToken({
      requesterId: userId,
      combatId: characterId,
      expectedDto: 'AttackRequestDto',
    });

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
      phase: 'PLAYER_TURN' as const,
      actionToken,
      expectedDto: 'AttackRequestDto',
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
