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
    const allEnemiesDead = result.combatState.enemies.every(e => (e.hp ?? 0) <= 0);
    if (!result.combatState.inCombat || allEnemiesDead) {
      gameStore.appendMessage('system', '🏆 Victoire! Tous les ennemis sont vaincus.');
      combatStore.clearCombat();
    }
  };

  const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

  const showPlayerAttackAnimation = async (result: AttackResponseDto): Promise<void> => {
    currentPlayerAttackLog.value = result;
    await delay(combatStore.PLAYER_ATTACK_DELAY_MS);
    currentPlayerAttackLog.value = null;
  };

  /**
   * Execute an attack against a target
   */
  const executeAttack = async (target: CombatantDto): Promise<void> => {
    if (!currentCharacter.value) return;
    gameStore.appendMessage('user', `J'attaque ${target.name}!`);
    gameStore.sending = true;
    currentTarget.value = target;

    try {
      const result = await combatService.attack(currentCharacter.value.characterId, target);
      currentAttackResult.value = result;
      combatStore.initializeCombat(result.combatState);
      await showPlayerAttackAnimation(result);
      displayAttackResultMessage(target, result);
      checkCombatVictory(result);
    } catch (err) {
      handleAttackError(err);
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
