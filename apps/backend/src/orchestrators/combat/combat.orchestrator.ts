import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { CharacterService } from "../../domain/character/character.service.js";
import { ConversationService } from "../../domain/chat/conversation.service.js";
import { CombatAppService } from "../../domain/combat/combat.app.service.js";

import { CombatEndDto } from "../../domain/combat/dto/CombatEndDto.js";
import type {
  CombatEndResponseDto,
  CombatStartRequestDto,
  EndPlayerTurnResponseDto,
} from "../../domain/combat/dto/index.js";
import { CombatStateDto } from "../../domain/combat/dto/index.js";
import { DiceService } from "../../domain/dice/dice.service.js";
import { GeminiTextService } from "../../infra/external/gemini-text.service.js";

/**
 * CombatOrchestrator coordinates combat flows across multiple domain services.
 * Controllers should call this orchestrator instead of directly calling domain services.
 *
 * Responsibilities:
 * - Start combat (character lookup + combat initialization + token generation)
 * - Process attacks (token management + dice rolls + damage application)
 * - Resolve rolls (token validation + damage application)
 * - End combat (cleanup + XP distribution)
 */
@Injectable()
export class CombatOrchestrator {
  private readonly logger = new Logger(CombatOrchestrator.name);

  constructor(
    private readonly combatAppService: CombatAppService,
    private readonly characterService: CharacterService,
    private readonly conversationService: ConversationService,
    private readonly geminiTexteService: GeminiTextService,
  ) {}

  /**
   * Initialize combat for a character.
   * Loads character data, initializes combat state, and generates first action token.
   */
  async startCombat(
    userId: string,
    characterId: string,
    combatStartRequest: CombatStartRequestDto,
  ): Promise<CombatStateDto> {
    const characterDto = await this.characterService.findByCharacterId(userId, characterId);
    let state = await this.combatAppService.initializeCombat(
      characterDto,
      combatStartRequest,
      userId,
    );

    // Early return when there are no enemy turns before the player activation
    if (state.turnOrder.length === 0 || state.turnOrder[0].isPlayer) {
      this.logger.log(
        `Combat started for character ${characterId} with ${combatStartRequest.combat_start.length} enemies`,
      );
      state.narrative = (await this.combatAppService.getCombatSummary(characterId)) ?? undefined;
      return state;
    }

    // If turn order begins with an enemy, simulate initial turns here
    const playerIndex = state.turnOrder.findIndex(c => c.isPlayer);
    const enemyTurnsBeforeFirstPlayer =
      playerIndex >= 0 ? state.turnOrder.slice(0, playerIndex) : state.turnOrder.slice();

    // Process sequentially — stop if the player dies (no dice service needed in new system)
    const { state: processedState, playerDefeated } = await this.combatAppService.processEnemyTurns(
      characterId,
      state,
      enemyTurnsBeforeFirstPlayer,
    );

    // Update to processed state
    state = processedState;

    if (playerDefeated) {
      await this.combatAppService.saveCombatState(state);
      this.logger.log(
        `Combat initialized (and ended) for ${characterId} after initial enemy turns`,
      );
      state.narrative = (await this.combatAppService.getCombatSummary(characterId)) ?? undefined;
      return state;
    }

    // Advance to player's activation and reset economy
    const finalState = await this.combatAppService.getCombatState(characterId);
    finalState.currentTurnIndex = finalState.turnOrder.findIndex(c => c.isPlayer) ?? 0;
    await this.combatAppService.saveCombatState(finalState);

    // Use freshest state for return
    state = finalState;

    this.logger.log(
      `Combat started for character ${characterId} with ${combatStartRequest.combat_start.length} enemies`,
    );

    state.narrative = (await this.combatAppService.getCombatSummary(characterId)) ?? undefined;
    return state;
  }

  /**
   * End player turn and process all enemy attacks.
   * Returns attack logs for frontend to replay with animations.
   */
  public async endPlayerTurn(
    userId: string,
    characterId: string,
  ): Promise<EndPlayerTurnResponseDto> {
    const combatState = await this.combatAppService.getCombatState(characterId);
    if (!combatState) throw new NotFoundException("combat state not found");

    // Process enemy turns in order (no dice service needed in new system)
    const aliveEnemies = combatState.enemies.filter(e => (e.hp ?? 0) > 0);
    const enemyTurnResult = await this.combatAppService.processEnemyTurns(
      characterId,
      combatState,
      aliveEnemies,
    );

    const finalState = enemyTurnResult.state;

    if (!finalState) throw new NotFoundException("combat state not found after enemy turns");

    // If the enemy turn did not end the combat (player still alive), advance to next player
    // activation and persist the refreshed state.
    if (!enemyTurnResult.playerDefeated) {
      finalState.currentTurnIndex = finalState.turnOrder.findIndex(c => c.isPlayer) ?? 0;
      finalState.roundNumber = (finalState.roundNumber ?? 1) + 1;
      await this.combatAppService.saveCombatState(finalState);
    } else {
      // If player died, the session may have been cleaned up by endCombat; ensure finalState
      // reflects combat end.
      finalState.inCombat = false;
    }

    return {
      roundNumber: finalState.roundNumber,
      attackLogs: enemyTurnResult.attackLogs,
      totalDamageToPlayer: enemyTurnResult.totalDamage,
      playerDefeated: enemyTurnResult.playerDefeated,
      combatState: finalState,
    };
  }

  private initializeChatSessionIfNeeded = async (userId: string, characterId: string) => {
    const previousChatMessages = await this.conversationService.getHistoryMessages(
      userId,
      characterId,
    );
    const character = await this.characterService.findByCharacterId(userId, characterId);
    return this.geminiTexteService.initializeChatSession(
      characterId,
      this.geminiTexteService.initPrompt(
        character,
        this.conversationService.buildCharacterSummary(character),
      ),
      previousChatMessages,
    );
  };

  /**
   * Generate combat end narrative using Gemini AI
   */
  private async generateCombatEndNarrative(
    userId: string,
    characterId: string,
    combatEnd: CombatEndDto,
  ): Promise<string> {
    const combatEndInstruction = {
      type: "combat_end",
      combat_end: combatEnd,
    };

    const message = `Le combat vient de se terminer. Voici les détails:\n${JSON.stringify(combatEndInstruction, null, 2)}\n\nGénère une narrative épique décrivant la conclusion du combat et pose la question d'action habituelle.`;

    const chatExists = this.geminiTexteService.hasChatSession(characterId);
    if (!chatExists) await this.initializeChatSessionIfNeeded(userId, characterId);

    const { narrative } = await this.geminiTexteService.sendMessage(characterId, message);
    return narrative;
  }

  /**
   * Get current combat status with fresh action token.
   */
  async getStatus(userId: string, characterId: string): Promise<CombatStateDto> {
    const inCombat = await this.combatAppService.isInCombat(characterId);
    const state = await this.combatAppService.getCombatState(characterId);
    if (!state) throw new BadRequestException("No combat at the moment");

    if (!inCombat) {
      // Get combat session to check if narrative already exists
      const session = await this.combatAppService.getCombatSessionRaw(characterId);
      let narrative = session?.narrative;

      // Lazy generate narrative if not already present
      if (!narrative) {
        const character = await this.characterService.findByCharacterId(userId, characterId);
        const combatEnd = new CombatEndDto({
          victory: true,
          xp_gained: 100,
          player_hp: character?.hp ?? 0,
          enemies_defeated: state.enemies.map(e => e.name),
          fled: false,
        });

        narrative = await this.generateCombatEndNarrative(userId, characterId, combatEnd);

        // Persist narrative in session via AppService
        await this.combatAppService.updateNarrative(characterId, narrative);
      }

      const character = await this.characterService.findByCharacterId(userId, characterId);
      const combatEnd = new CombatEndDto({
        victory: true,
        xp_gained: 100,
        player_hp: character?.hp ?? 0,
        enemies_defeated: state.enemies.map(e => e.name),
        fled: false,
      });

      return new CombatStateDto({
        characterId,
        inCombat: false,
        combatEnd,
        narrative,
      });
    }

    return state;
  }

  /**
   * Force end combat (flee).
   */
  async endCombat(userId: string, characterId: string): Promise<CombatEndResponseDto> {
    const character = await this.characterService.findByCharacterId(userId, characterId);
    if (!character) {
      throw new BadRequestException("Character not found");
    }

    if (!(await this.combatAppService.isInCombat(characterId))) {
      return {
        success: false,
        message: "Aucun combat en cours.",
      };
    }

    await this.combatAppService.endCombat(characterId);
    this.logger.log(`Combat forcefully ended for ${characterId}`);

    return {
      success: true,
      message: "Vous avez fui le combat.",
      instructions: [
        {
          combat_end: {
            victory: false,
            xp_gained: 0,
            player_hp: character.hp!,
            enemies_defeated: [],
            fled: true,
          },
        },
      ],
    };
  }
}
