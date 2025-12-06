import type {
  AttackResponseDto,
  CombatantDto,
  CombatStartInstructionMessageDto,
} from '@rpg-gen/shared';
import { storeToRefs } from 'pinia';
import { combatService } from '../apis/combatApi';
import { useCharacterStore } from '../stores/characterStore';
import { useCombatStore } from '../stores/combatStore';
import { useGameStore } from '../stores/gameStore';
import { conversationService } from '@/apis/conversationApi';

/**
 * Composable for combat-specific actions and state management
 */

export function useCombat() {
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  const combatStore = useCombatStore();
  const {
    currentTarget,
    currentAttackResult,
    currentPlayerAttackLog,
  } = storeToRefs(combatStore);
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

  const displayAttackResultMessage = (target: CombatantDto, result: AttackResponseDto): void => {
    const {
      damageTotal,
      isCrit,
    } = result;
    if (damageTotal && damageTotal > 0) {
      const critMsg = isCrit ? ' (CRITIQUE!)' : '';
      gameStore.appendMessage('system', `✅ Attaque réussie contre ${target.name}! Dégâts: ${damageTotal}${critMsg}`);
    } else {
      gameStore.appendMessage('system', `❌ Attaque manquée contre ${target.name}.`);
    }
  };

  const handleAttackError = (err: unknown): void => {
    const message = err instanceof Error ? err.message : 'Failed to attack';
    const sessionLost = message.includes('Combat session not found') || message.includes('Character is not in combat');
    if (sessionLost) {
      combatStore.clearCombat();
      gameStore.appendMessage('system', '⚠️ Combat terminé (session introuvable) — l\'état a été réinitialisé.');
    } else {
      gameStore.appendMessage('system', `❌ Erreur: ${message}`);
    }
  };

  const checkCombatVictory = (result: AttackResponseDto): void => {
    // First check if backend returned explicit combatEnd
    if (!result.combatEnd) return;
    handleCombatEnd(
      result.combatEnd.victory,
      result.combatEnd.xp_gained,
      result.combatEnd.enemies_defeated,
    );
  };

  const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

  const showPlayerAttackAnimation = async (result: AttackResponseDto): Promise<void> => {
    currentPlayerAttackLog.value = result;
    await delay(combatStore.PLAYER_ATTACK_DELAY_MS);
    currentPlayerAttackLog.value = null;
  };

  /* Helpers to keep executeAttack small (reduce statement count) */
  const beginAttack = (target: CombatantDto) => {
    gameStore.appendMessage('user', `J'attaque ${target.name}!`);
    gameStore.sending = true;
    currentTarget.value = target;
  };

  const processAttackResult = async (result: AttackResponseDto, target: CombatantDto) => {
    currentAttackResult.value = result;
    combatStore.initializeCombat(result.combatState);
    await showPlayerAttackAnimation(result);
    displayAttackResultMessage(target, result);
    checkCombatVictory(result);
  };

  /**
   * Execute an attack against a target
   */
  const executeAttack = async (target: CombatantDto): Promise<void> => {
    if (!currentCharacter.value) return;

    // Guard: prevent executing an attack when player cannot act or it's not the player's turn.
    if (!combatStore.canPlayerAct || !combatStore.isPlayerTurn) {
      gameStore.appendMessage('system', 'Vous ne pouvez pas attaquer pour le moment — plus d\'actions ou ce n\'est pas votre tour.');
      return;
    }

    // Prevent duplicate calls while a send is in progress
    if (gameStore.sending) return;

    beginAttack(target);

    try {
      const result = await combatService.attack(currentCharacter.value.characterId, target);
      await processAttackResult(result, target);
    } catch (err) {
      handleAttackError(err);
    } finally {
      gameStore.sending = false;
    }
  };

  /**
   * Handle combat end instruction
   */
  const handleCombatEnd = async (victory: boolean, xpGained: number, enemiesDefeated: string[]): Promise<void> => {
    if (!victory) {
      gameStore.appendMessage('system', '💀 Combat terminé.');
      combatStore.clearCombat();
      return;
    }
    gameStore.appendMessage('system', '🏆 Victoire!');
    if (enemiesDefeated.length > 0) {
      gameStore.appendMessage('system', `⚔️ Ennemis vaincus: ${enemiesDefeated.join(', ')}`);
    }
    if (xpGained > 0) {
      gameStore.appendMessage('system', `✨ XP gagnés: ${xpGained}`);
      characterStore.updateXp(xpGained);
    }
    const gmResponse = await conversationService.sendStructuredMessage({
      role: 'system',
      instructions: [],
      narrative: 'Combat terminé le joueur a vaincu ses ennemis. Fournis une brève description narrative de la victoire et de ses conséquences dans le jeu.',
    });
    gameStore.appendMessage('assistant', gmResponse.narrative);
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
    if (!currentCharacter.value) return false;
    const { inCombat } = await combatStore.fetchStatus(currentCharacter.value?.characterId);
    return inCombat;
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
