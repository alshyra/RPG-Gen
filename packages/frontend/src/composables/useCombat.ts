import { useGameStore } from '../stores/gameStore';
import { useCharacterStore } from '../stores/characterStore';
import { useCombatStore } from '../stores/combatStore';
import { combatService } from '../apis/combatApi';
import type {
  CombatStartInstructionMessageDto, TurnResultWithInstructionsDto, RollInstructionMessageDto,
  HpInstructionMessageDto, XpInstructionMessageDto, GameInstructionDto,
  CombatEnemyDto,
} from '@rpg-gen/shared';
import { isRollInstruction, isHpInstruction, isXpInstruction } from '@rpg-gen/shared';
import { storeToRefs } from 'pinia';

type GameStore = ReturnType<typeof useGameStore>;
type CharacterStore = ReturnType<typeof useCharacterStore>;
type CombatStore = ReturnType<typeof useCombatStore>;

// ----- Instruction Processors -----
function processRollInstruction(instr: RollInstructionMessageDto, gameStore: GameStore, combatStore: CombatStore): void {
  const {
    dices, meta,
  } = instr;
  const rollInstr: RollInstructionMessageDto = {
    type: 'roll',
    dices,
    advantage: 'none',
    description: meta?.target ? `Attack vs ${meta.target} (AC ${meta.targetAc ?? '??'})` : undefined,
    meta,
  };

  combatStore.setActionToken(combatStore.actionToken, 'AWAITING_DAMAGE_ROLL', 'DiceThrowDto');
  gameStore.pendingInstruction = rollInstr;
  const bonus = meta?.attackBonus ? ` +${meta.attackBonus}` : '';
  const target = meta?.target ? ` vs ${meta.target} (AC ${meta.targetAc})` : '';
  gameStore.appendMessage('system', `🎲 Roll needed: ${dices}${bonus}${target}`);
}

function processXpInstruction(instr: XpInstructionMessageDto, gameStore: GameStore, characterStore: CharacterStore): void {
  gameStore.appendMessage('system', `✨ Gained ${instr.xp} XP`);
  characterStore.updateXp(instr.xp);
}

function processHpInstruction(instr: HpInstructionMessageDto, gameStore: GameStore, characterStore: CharacterStore): void {
  const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
  gameStore.appendMessage('system', `❤️ HP changed: ${hpChange}`);
  characterStore.updateHp(instr.hp);
  if (characterStore.isDead) characterStore.showDeathModal = true;
}

function processSingleCombatInstruction(
  instr: GameInstructionDto,
  gameStore: GameStore,
  characterStore: CharacterStore,
  combatStore: CombatStore,
): void {
  if (isRollInstruction(instr)) {
    processRollInstruction(instr, gameStore, combatStore);
  } else if (isXpInstruction(instr)) {
    processXpInstruction(instr, gameStore, characterStore);
  } else if (isHpInstruction(instr)) {
    processHpInstruction(instr, gameStore, characterStore);
  }
}

function processAttackInstructions(
  instructions: GameInstructionDto[],
  gameStore: GameStore,
  characterStore: CharacterStore,
  combatStore: CombatStore,
): void {
  instructions.forEach(instr => processSingleCombatInstruction(instr, gameStore, characterStore, combatStore));
}

// ----- Attack Helpers -----
async function performAttack(characterId: string, target: CombatEnemyDto, token: string | null): Promise<TurnResultWithInstructionsDto> {
  if (!token) {
    throw new Error('Action token is required for attack');
  }
  return combatService.attackWithToken(characterId, token, target);
}

const handleAttackAnimations = (attackResponse: TurnResultWithInstructionsDto, combatStore: CombatStore): void => {
  const playerAttacks = attackResponse.playerAttacks ?? [];
  const enemyAttacks = attackResponse.enemyAttacks ?? [];
  if (playerAttacks.length > 0 || enemyAttacks.length > 0) {
    combatStore.startAttackAnimation(playerAttacks, enemyAttacks);
  }
};

const handleCombatEndFromResponse = (attackResponse: TurnResultWithInstructionsDto, gameStore: GameStore, combatStore: CombatStore): void => {
  if (attackResponse.victory) {
    gameStore.appendMessage('system', '🏆 Combat terminé - Victoire!');
  } else if (attackResponse.defeat) {
    gameStore.appendMessage('system', '💀 Combat terminé - Défaite...');
  }
  combatStore.clearCombat();
};

/**
 * Composable for combat-specific actions and state management
 */
export function useCombat() {
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  const combatStore = useCombatStore();
  const { currentCharacter } = storeToRefs(characterStore);

  const displayCombatStartSuccess = (combatState: {
    narrative?: string;
    turnOrder: {
      name: string;
      initiative: number;
    }[];
  }): void => {
    if (combatState.narrative) gameStore.appendMessage('system', combatState.narrative);
    const initiativeOrder = combatState.turnOrder.map(c => `${c.name} (${c.initiative})`)
      .join(' → ');
    gameStore.appendMessage('system', `📋 Ordre d'initiative: ${initiativeOrder}`);
    gameStore.appendMessage('system', 'Utilisez /attack [nom_ennemi] pour attaquer.');
  };

  /**
   * Initialize combat from a combat_start instruction
   */
  const initializeCombat = async (instruction: CombatStartInstructionMessageDto): Promise<void> => {
    console.log('[useCombat] initializeCombat instruction', instruction);
    if (!currentCharacter.value) return;

    const enemyNames = instruction.combat_start.map(e => e.name)
      .join(', ');
    gameStore.appendMessage('system', `⚔️ Combat engagé! Ennemis: ${enemyNames}`);

    try {
      const payload = { combat_start: instruction.combat_start };
      const combatState = await combatStore.startCombat(currentCharacter.value.characterId, payload);
      displayCombatStartSuccess(combatState);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start combat';
      gameStore.appendMessage('system', `❌ Erreur de combat: ${errorMsg}`);
    }
  };

  const handleAttackSuccess = async (
    attackResponse: TurnResultWithInstructionsDto,
    characterId: string,
  ): Promise<void> => {
    combatStore.updateFromTurnResult(attackResponse);
    handleAttackAnimations(attackResponse, combatStore);
    if (currentCharacter.value) currentCharacter.value.hp = attackResponse.playerHp;
    gameStore.appendMessage('assistant', attackResponse.narrative);

    if (attackResponse.instructions) {
      processAttackInstructions(attackResponse.instructions, gameStore, characterStore, combatStore);
    }
    if (attackResponse.combatEnded) {
      handleCombatEndFromResponse(attackResponse, gameStore, combatStore);
    } else {
      await combatStore.fetchStatus(characterId);
    }
  };

  /**
   * Execute an attack against a target using actionToken for idempotency
   */
  const executeAttack = async (target: CombatEnemyDto): Promise<void> => {
    if (!currentCharacter.value) return;
    gameStore.appendMessage('user', `J'attaque ${target}!`);
    gameStore.sending = true;

    try {
      const { characterId } = currentCharacter.value;
      console.log('[useCombat] executeAttack ->', {
        characterId,
        targetName: target.name,
        actionToken: combatStore.actionToken,
      });
      const attackResponse = await performAttack(characterId, target, combatStore.actionToken);
      await handleAttackSuccess(attackResponse, characterId);
    } catch (err) {
      gameStore.appendMessage('system', `❌ Erreur: ${err instanceof Error ? err.message : 'Failed to attack'}`);
    } finally {
      gameStore.sending = false;
    }
  };

  /**
   * Handle combat end instruction
   */
  const handleCombatEnd = (victory: boolean, xpGained: number, enemiesDefeated: string[]): void => {
    if (victory) {
      gameStore.appendMessage('system', '🏆 Victoire!');
      if (enemiesDefeated.length > 0) {
        gameStore.appendMessage('system', `⚔️ Ennemis vaincus: ${enemiesDefeated.join(', ')}`);
      }
      if (xpGained > 0) {
        gameStore.appendMessage('system', `✨ XP gagnés: ${xpGained}`);
        characterStore.updateXp(xpGained);
      }
    } else {
      gameStore.appendMessage('system', '💀 Combat terminé.');
    }
    combatStore.clearCombat();
  };

  /**
   * Flee from combat
   */
  const fleeCombat = async (): Promise<void> => {
    const character = characterStore.currentCharacter;
    if (!character) return;

    try {
      await combatService.endCombat(character.characterId);
      gameStore.appendMessage('system', '🏃 Vous avez fui le combat.');
      combatStore.clearCombat();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to flee';
      gameStore.appendMessage('system', `❌ Erreur: ${errorMsg}`);
    }
  };

  /**
   * Check if currently in combat
   */
  const checkCombatStatus = async (): Promise<boolean> => {
    const character = characterStore.currentCharacter;
    if (!character) return false;

    try {
      console.log('[useCombat] checking combat status for', character.characterId);
      const status = await combatStore.fetchStatus(character.characterId);
      console.log('[useCombat] fetched combat status', status);
      return status.inCombat;
    } catch {
      return false;
    }
  };

  return {
    // Actions
    initializeCombat,
    executeAttack,
    handleCombatEnd,
    fleeCombat,
    checkCombatStatus,
  };
}
