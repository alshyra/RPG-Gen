import type {
  AttackResponseDto,
  CombatantDto,
  CombatStartInstructionMessageDto,
} from '@rpg-gen/shared';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { combatService } from '../apis/combatApi';
import { useCharacterStore } from '../stores/characterStore';
import { useCombatStore } from '../stores/combatStore';
import { useGameStore } from '../stores/gameStore';
import { conversationApi } from '@/apis/conversationApi';

/**
 * Composable for combat-specific actions and state management
 */

export function useCombat() {
  const router = useRouter();
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  const combatStore = useCombatStore();
  const { currentTarget, currentAttackResult, currentPlayerAttackLog, currentAttackView } =
    storeToRefs(combatStore);
  const { currentCharacter } = storeToRefs(characterStore);

  const displayCombatStartSuccess = (combatState: {
    narrative?: string;
    turnOrder: {
      name: string;
      initiative: number;
    }[];
  }): void => {
    if (combatState.narrative) gameStore.appendMessage('system', combatState.narrative);
    const initiativeOrder = combatState.turnOrder
      .map(c => `${c.name} (${c.initiative})`)
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

    const enemyNames = instruction.combat_start.map(e => e.name).join(', ');
    gameStore.appendMessage('system', `⚔️ Combat engagé! Ennemis: ${enemyNames}`);

    try {
      const payload = { combat_start: instruction.combat_start };
      const combatState = await combatStore.startCombat(
        currentCharacter.value.characterId,
        payload,
      );
      displayCombatStartSuccess(combatState);
      // Navigate to combat arena when combat starts
      await router.push({
        name: 'game-combat',
        params: { characterId: currentCharacter.value.characterId },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start combat';
      gameStore.appendMessage('system', `❌ Erreur de combat: ${errorMsg}`);
    }
  };

  const displayAttackResultMessage = (target: CombatantDto, result: AttackResponseDto): void => {
    const targetName = target?.name || 'cible inconnue';
    const { damageTotal, isCrit } = result;
    if (damageTotal && damageTotal > 0) {
      const critMsg = isCrit ? ' (CRITIQUE!)' : '';
      gameStore.appendMessage(
        'system',
        `✅ Attaque réussie contre ${targetName}! Dégâts: ${damageTotal}${critMsg}`,
      );
    } else {
      gameStore.appendMessage('system', `❌ Attaque manquée contre ${targetName}.`);
    }
  };

  const handleAttackError = (err: unknown): void => {
    const message = err instanceof Error ? err.message : 'Failed to attack';
    const sessionLost =
      message.includes('Combat session not found') ||
      message.includes('Character is not in combat');
    if (sessionLost) {
      combatStore.clearCombat();
      gameStore.appendMessage(
        'system',
        "⚠️ Combat terminé (session introuvable) — l'état a été réinitialisé.",
      );
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
    const targetName = target?.name || 'cible inconnue';
    gameStore.appendMessage('user', `J'attaque ${targetName}!`);
    gameStore.sending = true;
    currentTarget.value = target;
  };

  const processAttackResult = async (result: AttackResponseDto, target: CombatantDto) => {
    if (!target?.id) {
      console.error('[useCombat] processAttackResult: invalid target', target);
      return;
    }

    // snapshot previous state (before applying server-returned state)
    const prevEnemies = combatStore.enemies.map(e => ({ ...e }));
    const prevPlayer = combatStore.player ? { ...combatStore.player } : null;

    // build client-friendly AttackView so components can display consistent values
    const targetBefore = prevEnemies.find(e => e.id === target.id);
    const targetAfter = result.combatState?.enemies?.find(e => e.id === target.id);

    const attackView = {
      attacker: prevPlayer?.name ?? 'Vous',
      attackerId: prevPlayer?.id,
      target: target.name ?? 'cible inconnue',
      targetId: target.id,
      hit: result.damageTotal !== undefined || !!result.damageDiceResult,
      damageRoll: result.damageDiceResult?.rolls ?? [],
      damageBonus: 0,
      totalDamage: result.damageTotal ?? 0,
      critical: result.isCrit ?? false,
      targetHpBefore: targetBefore?.hp ?? 0,
      targetHpAfter: targetAfter?.hp ?? 0,
      targetDefeated: (targetAfter?.hp ?? 0) <= 0,
    };

    currentAttackView.value = attackView;

    currentAttackResult.value = result;
    combatStore.initializeCombat(result.combatState);
    await showPlayerAttackAnimation(result);
    displayAttackResultMessage(target, result);
    checkCombatVictory(result);
  };

  /**
   * Execute an attack against a target
   */
  const executeAttack = async (target: CombatantDto, spellName?: string): Promise<void> => {
    if (!currentCharacter.value) return;

    // Guard: prevent executing an attack when player cannot act or it's not the player's turn.
    if (!combatStore.canPlayerAct || !combatStore.isPlayerTurn) {
      gameStore.appendMessage(
        'system',
        "Vous ne pouvez pas attaquer pour le moment — plus d'actions ou ce n'est pas votre tour.",
      );
      return;
    }

    // Prevent duplicate calls while a send is in progress
    if (gameStore.sending) return;

    beginAttack(target);

    try {
      const result = await combatService.attack(
        currentCharacter.value.characterId,
        target,
        spellName,
      );
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
  const handleCombatEnd = async (
    victory: boolean,
    xpGained: number,
    enemiesDefeated: string[],
  ): Promise<void> => {
    if (!victory) {
      gameStore.appendMessage('system', '💀 Combat terminé.');
      combatStore.clearCombat();
      // Navigate back to messages view
      await router.push({
        name: 'game',
        params: { characterId: currentCharacter.value?.characterId },
      });
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
    const gmResponse = await conversationApi.sendStructuredMessage({
      role: 'system',
      instructions: [],
      narrative:
        'Combat terminé le joueur a vaincu ses ennemis. Fournis une brève description narrative de la victoire et de ses conséquences dans le jeu.',
    });
    gameStore.appendMessage('assistant', gmResponse.narrative);
    // Navigate back to messages view after narration
    await router.push({
      name: 'game',
      params: { characterId: currentCharacter.value?.characterId },
    });
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
      // Navigate back to messages view
      await router.push({
        name: 'game',
        params: { characterId: character.characterId },
      });
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
    // If player is in combat after refresh, navigate to combat arena
    if (inCombat) {
      await router.push({
        name: 'game-combat',
        params: { characterId: currentCharacter.value.characterId },
      });
    }
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
