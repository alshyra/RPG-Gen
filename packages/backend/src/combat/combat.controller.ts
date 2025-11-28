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

    if (!body.combat_start || !Array.isArray(body.combat_start) || body.combat_start.length === 0) {
      throw new BadRequestException('combat_start array with at least one enemy is required');
    }

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
    @Body() body: AttackRequestDto,
  ): Promise<TurnResultWithInstructionsDto> {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    if (!body.target) {
      throw new BadRequestException('target is required');
    }

    // Verify character ownership
    const character = await this.characterService.findByCharacterId(userId, characterId);

    if (!(await this.combatService.isInCombat(characterId))) {
      throw new BadRequestException('Character is not in combat');
    }

    const result = await this.combatService.processPlayerAttack(characterId, body.target);
    if (!result) {
      const validTargets = await this.combatService.getValidTargets(characterId);
      throw new BadRequestException(
        `Invalid target: ${body.target}. Valid targets: ${validTargets.join(', ')}`,
      );
    }

    // Generate instructions for frontend processing
    const instructions: unknown[] = [];

    // Add HP change instruction if player took damage
    const totalPlayerDamage = result.enemyAttacks.reduce(
      (sum, attack) => sum + (attack.hit ? attack.totalDamage : 0),
      0,
    );
    if (totalPlayerDamage > 0) {
      instructions.push({ hp: -totalPlayerDamage });
    }

    // If combat ended with victory, add XP
    if (result.victory) {
      const combatEnd = await this.combatService.endCombat(characterId);
      if (combatEnd) {
        instructions.push({ xp: combatEnd.xpGained });
        instructions.push({
          combat_end: {
            victory: true,
            xp_gained: combatEnd.xpGained,
            player_hp: result.playerHp,
            enemies_defeated: combatEnd.enemiesDefeated,
            narrative: 'Victoire! Tous les ennemis ont été vaincus',
          },
        });
      }
    } else if (result.defeat) {
      instructions.push({
        combat_end: {
          victory: false,
          xp_gained: 0,
          player_hp: 0,
          enemies_defeated: [],
          narrative: 'Défaite... Vous tombez inconscient.',
        },
      });
      await this.combatService.endCombat(characterId);
    }

    this.logger.log(`Attack processed for ${characterId}: hit=${result.playerAttacks[0]?.hit}, victory=${result.victory}, defeat=${result.defeat}`);

    return {
      ...result,
      instructions,
    };
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
          player_hp: character.hp,
          enemies_defeated: [],
          fled: true,
          narrative: 'Vous avez fui le combat.',
        },
      }],
    };
  }
}
