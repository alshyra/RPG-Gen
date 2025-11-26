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
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CharacterService } from '../character/character.service.js';
import { UserDocument } from '../schemas/user.schema.js';
import { CombatService } from './combat.service.js';
import type { CombatStartInstruction, TurnResult } from './combat.types.js';

class AttackRequest {
  target: string;
}

class CombatStartRequest {
  combat_start: {
    name: string;
    hp: number;
    ac: number;
    attack_bonus?: number;
    damage_dice?: string;
    damage_bonus?: number;
  }[];
}

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
  @ApiBody({ type: CombatStartRequest })
  async startCombat(
    @Req() req: Request,
    @Param('characterId') characterId: string,
    @Body() body: CombatStartInstruction,
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    if (!body.combat_start || !Array.isArray(body.combat_start) || body.combat_start.length === 0) {
      throw new BadRequestException('combat_start array with at least one enemy is required');
    }

    const character = await this.characterService.findByCharacterId(userId, characterId);
    if (!character) {
      throw new BadRequestException('Character not found');
    }

    const characterDto = this.characterService.toCharacterDto(character);
    const state = await this.combatService.initializeCombat(characterDto, body, userId);

    this.logger.log(`Combat started for character ${characterId} with ${body.combat_start.length} enemies`);

    return {
      inCombat: true,
      roundNumber: state.roundNumber,
      playerInitiative: state.player.initiative,
      playerHp: state.player.hp,
      playerHpMax: state.player.hpMax,
      playerAc: state.player.ac,
      enemies: state.enemies.map(e => ({
        id: e.id,
        name: e.name,
        initiative: e.initiative,
        hp: e.hp,
        hpMax: e.hpMax,
      })),
      turnOrder: state.turnOrder,
      narrative: await this.combatService.getCombatSummary(characterId),
    };
  }

  @Post(':characterId/attack')
  @ApiOperation({ summary: 'Execute player attack in combat' })
  @ApiBody({ type: AttackRequest })
  async attack(
    @Req() req: Request,
    @Param('characterId') characterId: string,
    @Body() body: AttackRequest,
  ): Promise<TurnResult & { instructions?: unknown[] }> {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    if (!body.target) {
      throw new BadRequestException('target is required');
    }

    // Verify character ownership
    const character = await this.characterService.findByCharacterId(userId, characterId);
    if (!character) {
      throw new BadRequestException('Character not found');
    }

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
  async getStatus(
    @Req() req: Request,
    @Param('characterId') characterId: string,
  ) {
    const user = req.user as UserDocument;
    const userId = user._id.toString();

    // Verify character ownership
    const character = await this.characterService.findByCharacterId(userId, characterId);
    if (!character) {
      throw new BadRequestException('Character not found');
    }

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
      inCombat: true,
      roundNumber: state.roundNumber,
      playerHp: state.player.hp,
      playerHpMax: state.player.hpMax,
      enemies: state.enemies.filter(e => e.hp > 0).map(e => ({
        id: e.id,
        name: e.name,
        hp: e.hp,
        hpMax: e.hpMax,
      })),
      validTargets: await this.combatService.getValidTargets(characterId),
      narrative: await this.combatService.getCombatSummary(characterId),
    };
  }

  @Post(':characterId/end')
  @ApiOperation({ summary: 'Force end current combat (flee)' })
  async endCombat(
    @Req() req: Request,
    @Param('characterId') characterId: string,
  ) {
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
        },
      }],
    };
  }
}
