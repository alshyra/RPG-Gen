import {
  DiceThrowDto,
  RollInstructionMessageDto,
  HpInstructionMessageDto,
  XpInstructionMessageDto,
} from '@rpg-gen/shared';
import { watch } from 'vue';
// rollsService used for submitting roll results off /chat
import { rollsService } from '../apis/rollsApi';
import { getSkillBonus } from '../services/skillService';
import { useCharacterStore } from '../stores/characterStore';
import { useGameStore } from '../stores/gameStore';
import { useCombatStore } from '../stores/combatStore';
import { combatService } from '../apis/combatApi';

const getCriticalNote = (diceValue: number): string =>
  diceValue === 20
    ? ' (CRITICAL SUCCESS - Natural 20!)'
    : diceValue === 1
      ? ' (CRITICAL FAILURE - Natural 1!)'
      : '';

const buildRollMessage = (
  diceValue: number,
  bonus: number,
  skillName: string,
  total: number,
  criticalNote: string,
): string =>
  `Rolled: [${diceValue}] = ${diceValue}${
    bonus !== 0 ? ` + ${bonus}` : ''
  } (${skillName}) = **${total}**${criticalNote}`;

type GameStore = ReturnType<typeof useGameStore>;

const handleAdditionalRoll = (instr: RollInstructionMessageDto, gameStore: GameStore): void => {
  gameStore.pendingInstruction = instr;
  const meta: Record<string, any> | undefined = (instr as any).meta;
  const action = meta?.action as string | undefined;
  const targetName = meta?.target as string | undefined;
  const targetAc = typeof meta?.targetAc === 'number' ? meta.targetAc : undefined;
  const modifierLabel = typeof instr.modifier === 'number' ? ` +${instr.modifier}` : typeof instr.modifier === 'string' ? ` (${instr.modifier})` : '';
  const advLabel = instr.advantage === 'advantage' ? ' (ADVANTAGE ↑)' : instr.advantage === 'disadvantage' ? ' (DISADVANTAGE ↓)' : '';

  let message = `🎲 Roll needed: ${instr.dices}${modifierLabel}${advLabel}`;
  if (action === 'attack') {
    message = `⚔️ Attack roll${targetName ? ` vs ${targetName}` : ''}${typeof targetAc === 'number' ? ` (AC ${targetAc})` : ''}: ${instr.dices}${modifierLabel}${advLabel}`;
    if (meta?.damageDice) message += ` — if hit: damage ${meta.damageDice}${meta.damageBonus ? ` +${meta.damageBonus}` : ''}`;
  } else if (action === 'damage') {
    message = `💥 Damage roll for ${targetName ?? 'target'}: ${instr.dices}${modifierLabel}`;
  }

  gameStore.appendMessage('system', message);
};

const handleAdditionalXp = (
  instr: XpInstructionMessageDto,
  gameStore: GameStore,
  characterStore: ReturnType<typeof useCharacterStore>,
): void => {
  if (typeof instr.xp !== 'number') return;
  gameStore.appendMessage('system', `✨ Gained ${instr.xp} XP`);
  characterStore.updateXp(instr.xp);
};

const handleAdditionalHp = (
  instr: HpInstructionMessageDto,
  gameStore: GameStore,
  characterStore: ReturnType<typeof useCharacterStore>,
): void => {
  if (typeof instr.hp !== 'number') return;
  const hpChange = instr.hp > 0 ? `+${instr.hp}` : instr.hp;
  gameStore.appendMessage('system', `❤️ HP changed: ${hpChange}`);
  characterStore.updateHp(instr.hp);
  if (characterStore.isDead) characterStore.showDeathModal = true;
};

export const useGameRolls = () => {
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();

  const onDiceRolled = async (rollResult: DiceThrowDto): Promise<void> => {
    if (!gameStore.pendingInstruction || gameStore.pendingInstruction.type !== 'roll') return;
    const instr = gameStore.pendingInstruction as RollInstructionMessageDto;
    const skillName = typeof instr.modifier === 'string' ? instr.modifier : 'Roll';
    const skillBonus
      = typeof instr.modifier === 'string'
        ? getSkillBonus(characterStore.currentCharacter ?? null, skillName)
        : typeof instr.modifier === 'number'
          ? instr.modifier
          : 0;
    // include meta info (target, action, targetAc) so UI can display hit/miss
    const meta: Record<string, any> | undefined = (instr as any).meta;
    gameStore.rollData = {
      skillName,
      rolls: rollResult.rolls,
      bonus: skillBonus,
      total: rollResult.total + skillBonus,
      diceNotation: instr.dices,
      advantage: rollResult.advantage,
      keptRoll: rollResult.keptRoll,
      discardedRoll: rollResult.discardedRoll,
      action: meta?.action as string | undefined,
      target: meta?.target as string | undefined,
      targetAc: typeof meta?.targetAc === 'number' ? meta.targetAc : null,
    };
    gameStore.showRollModal = true;
  };

  watch(
    () => gameStore.latestRoll,
    (latest) => {
      if (!latest) return;
      onDiceRolled(latest);
    },
  );

  const sendRollResult = async (
    rollResult: { rolls: number[]; total: number; bonus: number; advantage?: boolean },
    skillName: string,
    criticalNote: string,
  ): Promise<void> => {
    // Send roll result as a structured instruction instead of embedding in narrative
    const instr = {
      type: 'roll',
      dices: skillName || 'roll',
      modifier: rollResult.bonus,
      description: `Result: ${JSON.stringify(rollResult)}${criticalNote}`,
    };

    // If this roll originates from a pending instruction that includes a game action
    // (for example attack/damage), route it to the combat endpoint so combat remains
    // server-authoritative and we don't use the generic /api/rolls path during fights.
    const pending = gameStore.pendingInstruction as any;
    const characterId = useCharacterStore().currentCharacter?.characterId;
    if (!characterId) {
      gameStore.appendMessage('system', 'No character selected; cannot submit roll.');
      return;
    }

    try {
      if (pending && pending.meta && typeof pending.meta.action === 'string') {
        // Map roll result into an action payload for combat resolve
        const action = pending.meta.action as string;
        const target = pending.meta.target as string | undefined;
        const die = Array.isArray(rollResult.rolls) && rollResult.rolls.length > 0 ? rollResult.rolls[0] : undefined;

        if (action === 'attack' || action === 'damage') {
          // For combat actions, call the combat resolve endpoint
          const payload: any = { action, target, total: rollResult.total };
          if (typeof die === 'number') payload.die = die;
          const resp = await combatService.resolveRoll(characterId, payload);

          // Process returned instructions (if any)
          if (resp && Array.isArray(resp.instructions)) {
            resp.instructions.forEach((p: any) => {
              if (p.type === 'roll') handleAdditionalRoll(p, gameStore);
              else if (p.type === 'xp') handleAdditionalXp(p, gameStore, characterStore);
              else if (p.type === 'hp') handleAdditionalHp(p, gameStore, characterStore);
            });
          } else {
            gameStore.appendMessage('system', 'Roll submitted to combat');
          }
          return;
        }
      }

      // Fallback: route non-combat rolls to the generic rolls API
      const resp = await rollsService.submitRoll(characterId, { instructions: [instr] });
      // The backend returns any pendingRolls that need client action
      if (resp && Array.isArray(resp.pendingRolls)) {
        resp.pendingRolls.forEach((p: any) => {
          if (p.type === 'roll') handleAdditionalRoll(p, gameStore);
          else if (p.type === 'xp') handleAdditionalXp(p, gameStore, characterStore);
          else if (p.type === 'hp') handleAdditionalHp(p, gameStore, characterStore);
        });
      } else {
        // provide minimal feedback in chat UI
        gameStore.appendMessage('system', 'Roll submitted');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      gameStore.appendMessage('system', 'Failed to submit roll: ' + msg);
    }
  };

  const confirmRoll = async (): Promise<void> => {
    if (!gameStore.pendingInstruction || gameStore.pendingInstruction.type !== 'roll') return;
    if (gameStore.sending) return;
    gameStore.sending = true;
    try {
      const { rolls, bonus, total, skillName } = gameStore.rollData;
      if (!rolls || rolls.length === 0) return;
      const diceValue = rolls[0];
      const criticalNote = getCriticalNote(diceValue);
      gameStore.appendMessage(
        'system',
        buildRollMessage(diceValue, bonus ?? 0, skillName ?? '', total ?? 0, criticalNote),
      );

      // If this roll comes from an attack instruction, send the resolved attack total to the server
      // and let the backend determine hit/miss and next instructions. Server is authoritative for combat.
      const pending = gameStore.pendingInstruction as any;
      if (pending && pending.meta && pending.meta.action === 'attack') {
        const meta = pending.meta as Record<string, any>;
        const attackTotal = total ?? 0;
        const targetName = meta.target as string | undefined;

        const characterId = useCharacterStore().currentCharacter?.characterId;
        if (!characterId) {
          gameStore.appendMessage('system', 'No character selected; cannot resolve attack.');
          return;
        }

        try {
          const dieRoll = Array.isArray(rolls) && rolls.length > 0 ? rolls[0] : undefined;
          const resp = await combatService.resolveRoll(characterId, { action: 'attack', target: targetName, total: attackTotal, die: dieRoll } as any);

          // If backend returned a turn result, update combat store
          try {
            const combatStore = useCombatStore();
            if (resp && (resp.remainingEnemies || resp.playerHp || resp.roundNumber)) {
              combatStore.updateFromTurnResult(resp);
            }
          } catch (e) {
            // ignore store update errors
          }

          // Process returned instructions (if any)
          if (resp && Array.isArray(resp.instructions)) {
            resp.instructions.forEach((instr: any) => {
              if (instr.type === 'roll') {
                // set pending instruction to let dice UI show
                gameStore.pendingInstruction = {
                  type: 'roll',
                  dices: instr.dices,
                  modifier: instr.modifier,
                  advantage: instr.advantage || 'none',
                  meta: instr.meta,
                  description: instr.description,
                } as any;
                // notify user
                gameStore.appendMessage('system', `🎲 ${instr.description ?? 'Additional roll required'}: ${instr.dices}`);
              } else if (typeof instr.xp === 'number') {
                handleAdditionalXp(instr, gameStore, characterStore);
              } else if (typeof instr.hp === 'number') {
                handleAdditionalHp(instr, gameStore, characterStore);
              }
            });
          }

          // Append any narrative from server
          if (resp && resp.narrative) {
            gameStore.appendMessage('assistant', resp.narrative);
          }

          // Hide roll modal if server resolved everything synchronously
          if (!resp || !Array.isArray(resp.instructions) || resp.instructions.length === 0) {
            gameStore.pendingInstruction = null;
            gameStore.showRollModal = false;
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          gameStore.appendMessage('system', `Failed to resolve attack on server: ${msg}`);
        }

        return;
      }

      // If this roll is a damage roll generated by our attack flow, apply damage locally
      if (pending && pending.meta && pending.meta.action === 'damage') {
        const meta = pending.meta as Record<string, any>;
        const damageTotal = total ?? 0;
        const targetName = meta.target as string | undefined;
        const combatStore = useCombatStore();

        // Find target enemy and apply damage
        const enemy = combatStore.enemies.find(e => e.name === targetName);
        if (enemy) {
          // Submit damage to server to persist and get updated turn result
          try {
            const characterId = useCharacterStore().currentCharacter?.characterId;
            if (characterId) {
              const resp = await combatService.resolveRoll(characterId, { action: 'damage', target: targetName, total: damageTotal });
              // Update combat store from returned result
              const combatStore = useCombatStore();
              if (resp) {
                try {
                  combatStore.updateFromTurnResult(resp);
                } catch (e) {
                  // best-effort local update if shape differs
                }
              }
              // Append damage message and remaining HP if available
              gameStore.appendMessage('system', `💥 Dégâts infligés à ${targetName}: ${damageTotal}`);
              try {
                if (resp && Array.isArray(resp.remainingEnemies)) {
                  const updated = resp.remainingEnemies.find((r: any) => r.name === targetName || r.id === (resp.targetId ?? undefined));
                  if (updated) {
                    const hpNow = typeof updated.hp === 'number' ? updated.hp : updated.currentHp ?? undefined;
                    const hpMax = updated.hpMax ?? updated.maxHp ?? undefined;
                    if (typeof hpNow === 'number') {
                      gameStore.appendMessage('system', `🩸 ${targetName} a ${hpNow}${hpMax ? `/${hpMax}` : ''} PV restants`);
                      if (hpNow <= 0) {
                        gameStore.appendMessage('system', `☠️ ${targetName} est vaincu !`);
                      }
                    }
                  }
                }
              } catch (e) {
                // ignore best-effort
              }
            }
          } catch (e) {
            gameStore.appendMessage('system', `Failed to submit damage: ${(e as Error).message}`);
          }
        } else {
          gameStore.appendMessage('system', `💥 Dégâts: ${damageTotal}`);
        }

        // Clear pending instruction and hide modal
        gameStore.pendingInstruction = null;
        gameStore.showRollModal = false;
        return;
      }

      // Non-attack roll: send result to conversation service for processing
      await sendRollResult({ rolls, total: total ?? 0, bonus: bonus ?? 0, advantage: false }, skillName ?? '', criticalNote);
      // close modal after sending non-combat roll
      gameStore.pendingInstruction = null;
      gameStore.showRollModal = false;
      return;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      gameStore.appendMessage('system', 'Failed to send roll result: ' + message);
      gameStore.showRollModal = false;
    } finally {
      gameStore.sending = false;
    }
  };

  const rerollDice = async (): Promise<void> => {
    // Re-run the dice expression through the backend RNG via the game store
    if (!gameStore.pendingInstruction || gameStore.pendingInstruction.type !== 'roll') return;
    const instr = gameStore.pendingInstruction as RollInstructionMessageDto;
    const expr = instr.dices;
    // Use the advantage/disadvantage from the instruction if specified
    const advantage = instr.advantage || 'none';
    try {
      const payload = await gameStore.doRoll(expr, advantage);
      // onDiceRolled handles mapping payload -> UI modal
      await onDiceRolled(payload);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      gameStore.appendMessage('system', 'Reroll failed: ' + msg);
    }
  };

  return { onDiceRolled, confirmRoll, rerollDice };
};
