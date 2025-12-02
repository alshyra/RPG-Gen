import type {
  DiceThrowDto,
  GameInstructionDto,
  RollInstructionMessageDto,
  TurnResultWithInstructionsDto,
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
import { useCombatStore } from '../stores/combatStore';
import { combatService } from '../apis/combatApi';

export function useGameRolls() {
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  const combatStore = useCombatStore();

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

  const processResponseInstructions = (
    instructions: GameInstructionDto[],
  ): void => {
    instructions.forEach(instr => processSingleInstruction(instr));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Combat roll helpers
  // ─────────────────────────────────────────────────────────────────────────────

  const updateCombatStoreFromResponse = (resp: TurnResultWithInstructionsDto | null): void => {
    if (!resp) return;
    if (resp.remainingEnemies ?? resp.playerHp ?? resp.roundNumber) {
      try {
        combatStore.updateFromTurnResult(resp);
      } catch {
      // best-effort update
      }
    }
  };

  const handleDamageEnemyHpDisplay = (
    resp: TurnResultWithInstructionsDto,
    targetName: string,
  ): void => {
    if (!Array.isArray(resp.remainingEnemies)) return;
    const updated = resp.remainingEnemies.find(e => e.name === targetName);
    if (!updated) return;
    const hpNow = typeof updated.hp === 'number' ? updated.hp : undefined;
    const hpMax = updated.hpMax ?? undefined;
    if (typeof hpNow !== 'number') return;
    gameStore.appendMessage('system', `🩸 ${targetName} a ${hpNow}${hpMax ? `/${hpMax}` : ''} PV restants`);
    if (hpNow <= 0) gameStore.appendMessage('system', `☠️ ${targetName} est vaincu !`);
  };

  const processSingleAttackInstruction = (
    instr: GameInstructionDto,
  ): void => {
    if (isRollInstruction(instr)) {
      gameStore.pendingInstruction = instr;
      gameStore.appendMessage('system', `🎲 ${instr.description ?? 'Additional roll required'}: ${instr.dices}`);
    } else if (isXpInstruction(instr)) {
      handleAdditionalXp(instr);
    } else if (isHpInstruction(instr)) {
      handleAdditionalHp(instr);
    }
  };

  const processAttackInstructions = (
    instructions: GameInstructionDto[],
  ): void => {
    instructions.forEach(instr => processSingleAttackInstruction(instr));
  };

  const handleAttackRollResponse = async (
    resp: TurnResultWithInstructionsDto,
  ): Promise<void> => {
    updateCombatStoreFromResponse(resp);

    if (resp.instructions && resp.instructions.length > 0) {
      processAttackInstructions(resp.instructions);
    }
    if (resp.narrative) gameStore.appendMessage('assistant', resp.narrative);

    // Hide modal if no further rolls needed
    if (!resp.instructions?.length) {
      gameStore.pendingInstruction = null;
      gameStore.showRollModal = false;
    }
  };

  const handleDamageRollResponse = async (
    resp: TurnResultWithInstructionsDto,
    targetName: string,
    damageTotal: number,
  ): Promise<void> => {
    updateCombatStoreFromResponse(resp);
    gameStore.appendMessage('system', `💥 Dégâts infligés à ${targetName}: ${damageTotal}`);
    try {
      handleDamageEnemyHpDisplay(resp, targetName);
    } catch {
    // best-effort
    }
  };

  const buildRollData = (
    rollResult: DiceThrowDto,
    instr: RollInstructionMessageDto,
    skillName: string,
    skillBonus: number,
  ) => {
    const { meta } = instr;
    return {
      skillName,
      rolls: rollResult.rolls,
      bonus: skillBonus,
      total: rollResult.total + skillBonus,
      diceNotation: instr.dices,
      advantage: rollResult.advantage,
      keptRoll: rollResult.keptRoll,
      discardedRoll: rollResult.discardedRoll,
      action: meta?.action,
      target: meta?.target,
      targetAc: typeof meta?.targetAc === 'number' ? meta.targetAc : null,
    };
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Store context type for helpers
  // ─────────────────────────────────────────────────────────────────────────────
  // StoreContext removed: use closure `gameStore`, `characterStore`, `combatStore`

  // ─────────────────────────────────────────────────────────────────────────────
  // Roll submission helpers (module-level)
  // ─────────────────────────────────────────────────────────────────────────────

  const submitCombatRoll = async (
    characterId: string,
    total: number,
    rolls: number[],
  ): Promise<void> => {
    const { actionToken } = combatStore;
    if (!actionToken) {
      gameStore.appendMessage('system', 'No action token available for combat roll');
      return;
    }
    const pending = gameStore.pendingInstruction;
    const action = pending && isRollInstruction(pending) ? pending.meta?.action : undefined;
    const target = pending && isRollInstruction(pending) ? pending.meta?.target : undefined;
    const payload: DiceThrowDto & { action?: string;
      target?: string; } = {
      rolls,
      mod: 0,
      total,
      action,
      target,
    };
    const resp = await combatService.resolveRollWithToken(characterId, actionToken, payload);
    if (resp?.instructions && resp.instructions.length > 0) {
      processResponseInstructions(resp.instructions);
    } else {
      gameStore.appendMessage('system', 'Roll submitted to combat');
    }
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
    const action = pending && isRollInstruction(pending) ? pending.meta?.action : undefined;
    const isCombatAction = action === 'attack' || action === 'damage';
    try {
      if (isCombatAction) {
        await submitCombatRoll(characterId, rollResult.total, rollResult.rolls);
      } else {
        const instr: RollInstructionMessageDto = {
          type: 'roll',
          dices: skillName || 'roll',
          modifierValue: rollResult.bonus,
          description: `Result: ${JSON.stringify(rollResult)}${criticalNote}`,
        };
        await submitNonCombatRoll(characterId, instr);
      }
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

  const handleConfirmAttack = async (): Promise<void> => {
    const {
      rolls, total,
    } = gameStore.rollData;
    const characterId = characterStore.currentCharacter?.characterId;
    const { actionToken } = combatStore;
    if (!characterId || !actionToken) {
      gameStore.appendMessage('system', 'No character or action token; cannot resolve attack.');
      return;
    }
    const pending = gameStore.pendingInstruction;
    const action = pending && isRollInstruction(pending) ? pending.meta?.action : undefined;
    const target = pending && isRollInstruction(pending) ? pending.meta?.target : undefined;
    const payload: DiceThrowDto & { action?: string;
      target?: string; } = {
      rolls: rolls ?? [],
      mod: 0,
      total: total ?? 0,
      action,
      target,
    };
    const resp = await combatService.resolveRollWithToken(characterId, actionToken, payload);
    if (resp) await handleAttackRollResponse(resp);
  };

  const handleConfirmDamage = async (pending: RollInstructionMessageDto): Promise<void> => {
    const {
      total, rolls,
    } = gameStore.rollData;
    const { meta } = pending;
    const targetName = meta?.target;
    const damageTotal = total ?? 0;
    const enemy = combatStore.enemies.find(e => e.name === targetName);
    if (!enemy) {
      gameStore.appendMessage('system', `💥 Dégâts: ${damageTotal}`);
      return;
    }
    const characterId = characterStore.currentCharacter?.characterId;
    const { actionToken } = combatStore;
    if (!characterId || !actionToken) return;
    const payload: DiceThrowDto & { action?: string;
      target?: string; } = {
      rolls: rolls ?? [],
      mod: 0,
      total: damageTotal,
      action: 'damage',
      target: targetName,
    };
    const resp = await combatService.resolveRollWithToken(characterId, actionToken, payload);
    if (resp && targetName) {
      await handleDamageRollResponse(resp, targetName, damageTotal);
    }
  };

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
    const closeModal = (): void => {
      gameStore.pendingInstruction = null;
      gameStore.showRollModal = false;
    };
    const action = pending.meta?.action;
    if (action === 'attack') {
      await handleConfirmAttack();
      return;
    }
    if (action === 'damage') {
      await handleConfirmDamage(pending);
      closeModal();
      return;
    }
    await handleConfirmNonCombat(criticalNote);
    closeModal();
  };
  const onDiceRolled = async (rollResult: DiceThrowDto): Promise<void> => {
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
