import type {
  CombatEnemyDto,
  CombatStartInstructionMessageDto,
} from '@rpg-gen/shared';
import { storeToRefs } from 'pinia';
import { combatService } from '../apis/combatApi';
import { useCharacterStore } from '../stores/characterStore';
import { useCombatStore } from '../stores/combatStore';
import { useGameStore } from '../stores/gameStore';
// rollsService not used here — combat roll submission is handled in useGameRolls

// local store types not required here — composable remains small and focused

// instruction processors intentionally not used inside this composable — handled in other modules (useGameRolls)

/**
 * Composable for combat-specific actions and state management
 */

export function useCombat() {
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  const combatStore = useCombatStore();
  const {
    currentTarget, showAttackResultModal, currentAttackResult,
  } = storeToRefs(combatStore);
  const { currentCharacter } = storeToRefs(characterStore);
  // uiStore omitted — not used here

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

  // handlePlayerFailedAttack intentionally removed: not needed in this composable

  const throwDamageDice = () => {
    if (!currentCharacter.value?.characterId) throw Error('Character is not defined');
    const rollInstr = currentAttackResult.value?.rollInstruction ?? (currentAttackResult.value as any)?.instructions?.[0];
    if (!rollInstr || rollInstr.type !== 'roll') {
      throw Error('currentAttackResult doesnt not have a valid roll instruction');
    }
    combatService.resolveRollWithToken(currentCharacter.value?.characterId, combatStore.actionToken!, rollInstr);
  };

  /**
   * Execute an attack against a target using actionToken for idempotency
   */
  const executeAttack = async (target: CombatEnemyDto): Promise<void> => {
    if (!currentCharacter.value) return;
    gameStore.appendMessage('user', `J'attaque ${target.name}!`);
    gameStore.sending = true;

    currentTarget.value = target;
    try {
      currentAttackResult.value = await combatService.attackWithToken(currentCharacter.value.characterId, combatStore.actionToken!, target);
      showAttackResultModal.value = true;
      const rollInstr = currentAttackResult.value?.rollInstruction ?? (currentAttackResult?.value as any)?.instructions?.[0];
      if (!rollInstr?.type || rollInstr.type == 'roll') return;
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
    if (!currentCharacter.value) return false;
    const { inCombat } = await combatStore.fetchStatus(currentCharacter.value?.characterId);
    return inCombat;
  };

  return {
    // Actions
    initializeCombat,
    throwDamageDice,
    executeAttack,
    handleCombatEnd,
    fleeCombat,
    checkCombatStatus,
  };
}
