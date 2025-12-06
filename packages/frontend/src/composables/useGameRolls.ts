import type {
  DiceResultDto,
  GameInstructionDto,
  RollInstructionMessageDto,
} from '@rpg-gen/shared';
import {
  isHpInstruction,
  isRollInstruction,
  isXpInstruction,
  type HpInstructionMessageDto, type XpInstructionMessageDto,
} from '@rpg-gen/shared';
import { watch } from 'vue';
import { rollsService } from '../apis/rollsApi';
import { getSkillBonus } from '../services/skillService';
import { useCharacterStore } from '../stores/characterStore';
import { useGameStore } from '../stores/gameStore';

export function useGameRolls() {
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  // combatStore removed - combat flow is handled elsewhere now

  const getCriticalNote = (diceValue: number): string => {
    if (diceValue === 20) return ' (CRITICAL SUCCESS - Natural 20!)';
    if (diceValue === 1) return ' (CRITICAL FAILURE - Natural 1!)';
    return '';
  };

  const buildRollMessage = (
    diceValue: number,
    bonus: number,
    skillName: string,
    total: number,
    criticalNote: string,
  ): string => {
    const bonusPart = bonus !== 0 ? ` + ${bonus}` : '';
    return `Rolled: [${diceValue}] = ${diceValue}${bonusPart} (${skillName}) = **${total}**${criticalNote}`;
  };

  const buildModifierLabel = (modifierLabel: string | undefined, modifierValue: number | undefined): string => {
    if (typeof modifierValue === 'number' && modifierValue !== 0) return ` +${modifierValue}`;
    if (typeof modifierLabel === 'string') return ` (${modifierLabel})`;
    return '';
  };

  const buildAdvantageLabel = (advantage: string | undefined): string => {
    if (advantage === 'advantage') return ' (ADVANTAGE ↑)';
    if (advantage === 'disadvantage') return ' (DISADVANTAGE ↓)';
    return '';
  };

  const buildAttackMessage = (
    instr: RollInstructionMessageDto,
    modLabel: string,
    advLabel: string,
  ): string => {
    const { meta } = instr;
    const targetPart = meta?.target ? ` vs ${meta.target}` : '';
    const acPart = typeof meta?.targetAc === 'number' ? ` (AC ${meta.targetAc})` : '';
    let message = `⚔️ Attack roll${targetPart}${acPart}: ${instr.dices}${modLabel}${advLabel}`;
    if (meta?.damageDice) {
      const bonusPart = meta.damageBonus ? ` +${meta.damageBonus}` : '';
      message += ` — if hit: damage ${meta.damageDice}${bonusPart}`;
    }
    return message;
  };

  const buildRollNeededMessage = (instr: RollInstructionMessageDto): string => {
    const modLabel = buildModifierLabel(instr.modifierLabel, instr.modifierValue);
    const advLabel = buildAdvantageLabel(instr.advantage);
    const { meta } = instr;
    if (meta?.action === 'attack') return buildAttackMessage(instr, modLabel, advLabel);
    if (meta?.action === 'damage') {
      return `💥 Damage roll for ${meta.target ?? 'target'}: ${instr.dices}${modLabel}`;
    }
    return `🎲 Roll needed: ${instr.dices}${modLabel}${advLabel}`;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Instruction handlers (side-effecting)
  // ─────────────────────────────────────────────────────────────────────────────

  const handleAdditionalRoll = (instr: RollInstructionMessageDto): void => {
    gameStore.pendingInstruction = instr;
    gameStore.appendMessage('system', buildRollNeededMessage(instr));
  };

  const handleAdditionalXp = (instr: XpInstructionMessageDto): void => {
    gameStore.appendMessage('system', `✨ Gained ${instr.xp} XP`);
    characterStore.updateXp(instr.xp);
  };

  const handleAdditionalHp = (instr: HpInstructionMessageDto): void => {
    const hpChange = instr.hp > 0 ? `+${instr.hp}` : String(instr.hp);
    gameStore.appendMessage('system', `❤️ HP changed: ${hpChange}`);
    characterStore.updateHp(instr.hp);
    if (characterStore.isDead) characterStore.showDeathModal = true;
  };

  const processSingleInstruction = (
    instr: GameInstructionDto,
  ): void => {
    if (isRollInstruction(instr)) handleAdditionalRoll(instr);
    else if (isXpInstruction(instr)) handleAdditionalXp(instr);
    else if (isHpInstruction(instr)) handleAdditionalHp(instr);
  };

  const buildRollData = (
    rollResult: DiceResultDto,
    instr: RollInstructionMessageDto,
    skillName: string,
    skillBonus: number,
  ) => {
    const { meta } = instr;
    // DiceResultDto no longer has advantage/keptRoll/discardedRoll - use instruction data instead
    return {
      skillName,
      rolls: rollResult.rolls,
      bonus: skillBonus,
      total: rollResult.total + skillBonus,
      diceNotation: instr.dices,
      advantage: instr.advantage,
      keptRoll: null,
      discardedRoll: null,
      action: meta?.action,
      target: meta?.target,
      targetAc: typeof meta?.targetAc === 'number' ? meta.targetAc : null,
    };
  };

  const submitNonCombatRoll = async (
    characterId: string,
    instr: RollInstructionMessageDto,
  ): Promise<void> => {
    const pendingRolls = await rollsService.submitRoll(characterId, { instructions: [instr] });
    if (pendingRolls) {
      pendingRolls.forEach(item => processSingleInstruction(item));
    } else {
      gameStore.appendMessage('system', 'Roll submitted');
    }
  };

  const sendRollResult = async (
    rollResult: { rolls: number[];
      total: number;
      bonus: number; },
    skillName: string,
    criticalNote: string,
  ): Promise<void> => {
    const characterId = characterStore.currentCharacter?.characterId;
    if (!characterId) {
      gameStore.appendMessage('system', 'No character selected; cannot submit roll.');
      return;
    }
    const pending = gameStore.pendingInstruction;
    // Always submit a generic roll instruction. Combat-specific handling is
    // performed by backend/game orchestrators in the new flow.
    try {
      const instr: RollInstructionMessageDto = {
        type: 'roll',
        dices: skillName || 'roll',
        modifierValue: rollResult.bonus,
        description: `Result: ${JSON.stringify(rollResult)}${criticalNote}`,
      };
      await submitNonCombatRoll(characterId, instr);
    } catch (e) {
      gameStore.appendMessage('system', `Failed to submit roll: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Confirm roll helpers (module-level)
  // ─────────────────────────────────────────────────────────────────────────────

  const displayRollMessage = (): { diceValue: number;
    criticalNote: string; } | null => {
    const {
      rolls, bonus, total, skillName,
    } = gameStore.rollData;
    if (!rolls?.length) return null;
    const [diceValue] = rolls;
    const criticalNote = getCriticalNote(diceValue);
    gameStore.appendMessage(
      'system',
      buildRollMessage(diceValue, bonus ?? 0, skillName ?? '', total ?? 0, criticalNote),
    );
    return {
      diceValue,
      criticalNote,
    };
  };

  // combat-specific confirm paths removed — handled by new combat flow elsewhere

  const handleConfirmNonCombat = async (criticalNote: string): Promise<void> => {
    const {
      rolls, bonus, total, skillName,
    } = gameStore.rollData;
    await sendRollResult(
      {
        rolls: rolls ?? [],
        total: total ?? 0,
        bonus: bonus ?? 0,
      },
      skillName ?? '',
      criticalNote,
    );
  };

  const handleConfirmRollAction = async (
    pending: RollInstructionMessageDto,
    criticalNote: string,
  ): Promise<void> => {
    // Close modal then treat all confirmations as non-combat roll submission.
    gameStore.pendingInstruction = null;
    gameStore.showRollModal = false;
    await handleConfirmNonCombat(criticalNote);
  };

  const onDiceRolled = async (rollResult: DiceResultDto): Promise<void> => {
    const pending = gameStore.pendingInstruction;
    if (!pending || !isRollInstruction(pending)) return;
    const skillName = pending.modifierLabel ?? 'Roll';
    const skillBonus = pending.modifierLabel
      ? getSkillBonus(characterStore.currentCharacter ?? null, skillName)
      : pending.modifierValue ?? 0;
    gameStore.rollData = buildRollData(rollResult, pending, skillName, skillBonus);
    gameStore.showRollModal = true;
  };

  watch(() => gameStore.latestRoll, latest => latest && onDiceRolled(latest));

  const confirmRoll = async (): Promise<void> => {
    const pending = gameStore.pendingInstruction;
    if (!pending || !isRollInstruction(pending) || gameStore.sending) return;
    gameStore.sending = true;
    try {
      const rollInfo = displayRollMessage();
      if (rollInfo) await handleConfirmRollAction(pending, rollInfo.criticalNote);
    } catch (e) {
      gameStore.appendMessage('system', `Failed to send roll result: ${e instanceof Error ? e.message : String(e)}`);
      gameStore.showRollModal = false;
    } finally {
      gameStore.sending = false;
    }
  };

  const rerollDice = async (): Promise<void> => {
    const pending = gameStore.pendingInstruction;
    if (!pending || !isRollInstruction(pending)) return;
    try {
      const payload = await gameStore.doRoll(pending.dices, pending.advantage ?? 'none');
      await onDiceRolled(payload);
    } catch (e) {
      gameStore.appendMessage('system', `Reroll failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return {
    onDiceRolled,
    confirmRoll,
    rerollDice,
  };
}
