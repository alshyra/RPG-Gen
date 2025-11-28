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
  let message = `🎲 Roll needed: ${instr.dices}${instr.modifier ? ` - ${JSON.stringify(instr.modifier)}` : ''}`;
  if (instr.advantage === 'advantage') {
    message += ' (with ADVANTAGE ↑)';
  } else if (instr.advantage === 'disadvantage') {
    message += ' (with DISADVANTAGE ↓)';
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
    gameStore.rollData = {
      skillName,
      rolls: rollResult.rolls,
      bonus: skillBonus,
      total: rollResult.total + skillBonus,
      diceNotation: instr.dices,
      advantage: rollResult.advantage,
      keptRoll: rollResult.keptRoll,
      discardedRoll: rollResult.discardedRoll,
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

    // Route roll results to the new rolls API so they are not persisted via /chat
    const characterId = useCharacterStore().currentCharacter?.characterId;
    if (!characterId) {
      gameStore.appendMessage('system', 'No character selected; cannot submit roll.');
      return;
    }

    try {
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
    const { rolls, bonus, total, skillName } = gameStore.rollData;
    if (!rolls || rolls.length === 0) return;
    const diceValue = rolls[0];
    const criticalNote = getCriticalNote(diceValue);
    gameStore.appendMessage(
      'system',
      buildRollMessage(diceValue, bonus ?? 0, skillName ?? '', total ?? 0, criticalNote),
    );
    try {
      // If this roll comes from an attack instruction, handle locally: evaluate hit vs AC and
      // if hit, trigger the damage roll instruction immediately.
      const pending = gameStore.pendingInstruction as any;
      if (pending && pending.meta && pending.meta.action === 'attack') {
        const meta = pending.meta as Record<string, any>;
        const attackTotal = total ?? 0;
        const targetAc = typeof meta.targetAc === 'number' ? meta.targetAc : undefined;
        const targetName = meta.target as string | undefined;

        const hit = typeof targetAc === 'number' ? attackTotal >= targetAc : false;
        gameStore.appendMessage('system', hit ? `✅ Attaque réussie contre ${targetName} (${attackTotal} ≥ ${targetAc})` : `❌ Attaque ratée contre ${targetName} (${attackTotal} < ${targetAc})`);

        // If hit, prepare and trigger damage roll
        if (hit) {
          const damageDice = meta.damageDice || '1d4';
          const damageBonus = typeof meta.damageBonus === 'number' ? meta.damageBonus : 0;
          const damageInstr = {
            type: 'roll',
            dices: damageDice,
            modifier: damageBonus,
            advantage: 'none',
            description: `Damage to ${targetName}`,
            meta: {
              action: 'damage',
              target: targetName,
              damageBonus,
            },
          } as any;

          // Set pending instruction for damage and trigger a server-side deterministic roll
          gameStore.pendingInstruction = damageInstr;
          // Automatically request a roll for the damage dice (this will update latestRoll and open modal)
          await gameStore.doRoll(damageDice, 'none');
          return;
        }

        // If miss, clear pending instruction and do not forward to conversation
        gameStore.pendingInstruction = null;
        gameStore.showRollModal = false;
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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      gameStore.appendMessage('system', 'Failed to send roll result: ' + message);
      gameStore.showRollModal = false;
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
