import { useGameStore } from '../stores/gameStore';
import { useCharacterStore } from '../stores/characterStore';
import { useCombatStore } from '../stores/combatStore';
import { combatService } from '../apis/combatApi';
import type { CombatStartInstructionMessageDto } from '@rpg-gen/shared';

/**
 * Composable for combat-specific actions and state management
 */
export function useCombat() {
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  const combatStore = useCombatStore();

  /**
   * Initialize combat from a combat_start instruction
   */
  const initializeCombat = async (instruction: CombatStartInstructionMessageDto): Promise<void> => {
    // show as a normal log so developers see it after reload without changing console filters
    console.log('[useCombat] initializeCombat instruction', instruction);
    const character = characterStore.currentCharacter;
    if (!character) return;

    const enemyNames = instruction.combat_start.map(e => e.name).join(', ');
    gameStore.appendMessage('system', `⚔️ Combat engagé! Ennemis: ${enemyNames}`);

    try {
      // Ensure we send only the expected request shape to the backend
      const payload = { combat_start: instruction.combat_start };
      const combatState = await combatStore.startCombat(character.characterId, payload);

      if (combatState.narrative) {
        gameStore.appendMessage('system', combatState.narrative);
      }

      // Display initiative order
      const initiativeOrder = combatState.turnOrder
        .map(c => `${c.name} (${c.initiative})`)
        .join(' → ');
      gameStore.appendMessage('system', `📋 Ordre d'initiative: ${initiativeOrder}`);
      gameStore.appendMessage('system', 'Utilisez /attack [nom_ennemi] pour attaquer.');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start combat';
      gameStore.appendMessage('system', `❌ Erreur de combat: ${errorMsg}`);
    }
  };

  /**
   * Execute an attack against a target
   */
  const executeAttack = async (target: string): Promise<void> => {
    const character = characterStore.currentCharacter;
    if (!character) return;

    gameStore.appendMessage('user', `J'attaque ${target}!`);
    gameStore.sending = true;

    try {
      // Debug: log which characterId and target we're sending
      console.log('[useCombat] executeAttack ->', { characterId: character.characterId, target });
      const attackResponse = await combatService.attack(character.characterId, target);

      // Update combat store with results
      combatStore.updateFromTurnResult(attackResponse);

      // Display combat narrative
      gameStore.appendMessage('assistant', attackResponse.narrative);

      // Process any instructions (HP changes, XP, etc.)
      if (attackResponse.instructions) {
        processAttackInstructions(attackResponse.instructions);
      }

      // Handle combat end
      if (attackResponse.combatEnded) {
        if (attackResponse.victory) {
          gameStore.appendMessage('system', '🏆 Combat terminé - Victoire!');
        } else if (attackResponse.defeat) {
          gameStore.appendMessage('system', '💀 Combat terminé - Défaite...');
        }
        combatStore.clearCombat();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to attack';
      gameStore.appendMessage('system', `❌ Erreur: ${errorMsg}`);
    } finally {
      gameStore.sending = false;
    }
  };

  /**
   * Process instructions from attack response
   */
  const processAttackInstructions = (instructions: unknown[]): void => {
    if (!Array.isArray(instructions)) return;
    instructions.forEach((item: unknown) => {
      const instr = item as Record<string, any>;
      const type = instr.type as string | undefined;

      if (type === 'roll') {
        // Map server roll instruction into the app's RollInstructionMessageDto shape
        const dices = instr.dices as string | undefined;
        const meta = instr.meta as Record<string, any> | undefined;
        const attackBonus = meta?.attackBonus as number | undefined;
        const target = meta?.target as string | undefined;
        const targetAc = meta?.targetAc as number | undefined;

        const rollInstr = {
          type: 'roll',
          dices: dices || '1d20',
          modifier: typeof attackBonus === 'number' ? attackBonus : undefined,
          advantage: 'none',
          description: target ? `Attack vs ${target} (AC ${targetAc ?? '??'})` : undefined,
        } as any;

        // Set pending instruction so Dice UI appears
        gameStore.pendingInstruction = rollInstr;
        gameStore.appendMessage('system', `🎲 Roll needed: ${rollInstr.dices}${attackBonus ? ` +${attackBonus}` : ''} ${target ? ` vs ${target} (AC ${targetAc})` : ''}`);
      } else if (typeof instr.xp === 'number') {
        gameStore.appendMessage('system', `✨ Gained ${instr.xp} XP`);
        characterStore.updateXp(instr.xp);
      } else if (typeof instr.hp === 'number') {
        const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
        gameStore.appendMessage('system', `❤️ HP changed: ${hpChange}`);
        characterStore.updateHp(instr.hp);
        if (characterStore.isDead) characterStore.showDeathModal = true;
      }
    });
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
    // State (from store)
    inCombat: combatStore.inCombat,
    enemies: combatStore.enemies,
    aliveEnemies: combatStore.aliveEnemies,
    validTargets: combatStore.validTargets,
    currentTarget: combatStore.currentTarget,
    roundNumber: combatStore.roundNumber,

    // Actions
    initializeCombat,
    executeAttack,
    handleCombatEnd,
    fleeCombat,
    checkCombatStatus,
    setTarget: combatStore.setTarget,
  };
}
