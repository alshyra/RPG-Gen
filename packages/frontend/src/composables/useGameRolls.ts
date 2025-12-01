import {
  DiceThrowDto,
  RollInstructionMessageDto,
  HpInstructionMessageDto,
  XpInstructionMessageDto,
  TurnResultWithInstructionsDto,
} from '@rpg-gen/shared';
import { watch } from 'vue';
import { rollsService } from '../apis/rollsApi';
import { getSkillBonus } from '../services/skillService';
import { useCharacterStore } from '../stores/characterStore';
import { useGameStore } from '../stores/gameStore';
import { useCombatStore } from '../stores/combatStore';
import { combatService } from '../apis/combatApi';

type GameStore = ReturnType<typeof useGameStore>;
type CharacterStore = ReturnType<typeof useCharacterStore>;
type CombatStore = ReturnType<typeof useCombatStore>;

interface InstructionMeta {
  action?: string;
  target?: string;
  targetAc?: number;
  damageDice?: string;
  damageBonus?: number;
}

// The generated RollInstructionMessageDto has modifier as Record<string, never>
// but in practice it can be string | number. Using a local interface.
interface RollInstructionWithMeta {
  type: 'roll';
  dices: string;
  modifier?: string | number;
  description?: string;
  advantage?: 'advantage' | 'disadvantage' | 'none';
  meta?: InstructionMeta;
}

interface CombatResolvePayload {
  action: string;
  target?: string;
  total: number;
  die?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure helper functions
// ─────────────────────────────────────────────────────────────────────────────

const getCriticalNote = (diceValue: number): string => {
  if (diceValue === 20) return ' (CRITICAL SUCCESS - Natural 20!)';
  if (diceValue === 1) return ' (CRITICAL FAILURE - Natural 1!)';
  return '';
};

const buildRollMessage = (diceValue: number, bonus: number, skillName: string, total: number, criticalNote: string): string => `Rolled: [${diceValue}] = ${diceValue}${bonus !== 0 ? ` + ${bonus}` : ''} (${skillName}) = **${total}**${criticalNote}`;

const buildModifierLabel = (modifier: string | number | undefined): string => {
  if (typeof modifier === 'number') return ` +${modifier}`;
  if (typeof modifier === 'string') return ` (${modifier})`;
  return '';
};

const buildAdvantageLabel = (advantage: string | undefined): string => {
  if (advantage === 'advantage') return ' (ADVANTAGE ↑)';
  if (advantage === 'disadvantage') return ' (DISADVANTAGE ↓)';
  return '';
};

const buildAttackMessage = (instr: RollInstructionWithMeta, meta: InstructionMeta, modLabel: string, advLabel: string): string => {
  const targetPart = meta.target ? ` vs ${meta.target}` : '';
  const acPart = typeof meta.targetAc === 'number' ? ` (AC ${meta.targetAc})` : '';
  let message = `⚔️ Attack roll${targetPart}${acPart}: ${instr.dices}${modLabel}${advLabel}`;
  if (meta.damageDice) {
    message += ` — if hit: damage ${meta.damageDice}${meta.damageBonus ? ` +${meta.damageBonus}` : ''}`;
  }
  return message;
};

const buildRollNeededMessage = (instr: RollInstructionWithMeta, meta: InstructionMeta | undefined): string => {
  const modLabel = buildModifierLabel(instr.modifier);
  const advLabel = buildAdvantageLabel(instr.advantage);
  if (meta?.action === 'attack') return buildAttackMessage(instr, meta, modLabel, advLabel);
  if (meta?.action === 'damage') return `💥 Damage roll for ${meta.target ?? 'target'}: ${instr.dices}${modLabel}`;
  return `🎲 Roll needed: ${instr.dices}${modLabel}${advLabel}`;
};

const extractDieFromRolls = (rolls: number[] | undefined): number | undefined => Array.isArray(rolls) && rolls.length > 0 ? rolls[0] : undefined;

// ─────────────────────────────────────────────────────────────────────────────
// Instruction handlers (side-effecting)
// Note: We cast from unknown because the generated RollInstructionMessageDto type
// has modifier as Record<string,never> but at runtime it's string | number.
// ─────────────────────────────────────────────────────────────────────────────

// Runtime cast: the generated type has incorrect modifier type (Record<string,never> instead of string|number)
const toRollInstruction = (item: unknown): RollInstructionWithMeta => item as RollInstructionWithMeta;
const toStorePendingInstruction = (instr: RollInstructionWithMeta): RollInstructionMessageDto => instr as unknown as RollInstructionMessageDto;

const handleAdditionalRoll = (item: unknown, gameStore: GameStore): void => {
  const instr = toRollInstruction(item);
  // Store the raw instruction for the modal
  gameStore.pendingInstruction = item as RollInstructionMessageDto;
  gameStore.appendMessage('system', buildRollNeededMessage(instr, instr.meta));
};

const handleAdditionalXp = (instr: XpInstructionMessageDto, gameStore: GameStore, charStore: CharacterStore): void => {
  if (typeof instr.xp !== 'number') return;
  gameStore.appendMessage('system', `✨ Gained ${instr.xp} XP`);
  charStore.updateXp(instr.xp);
};

const handleAdditionalHp = (instr: HpInstructionMessageDto, gameStore: GameStore, charStore: CharacterStore): void => {
  if (typeof instr.hp !== 'number') return;
  const hpChange = instr.hp > 0 ? `+${instr.hp}` : String(instr.hp);
  gameStore.appendMessage('system', `❤️ HP changed: ${hpChange}`);
  charStore.updateHp(instr.hp);
  if (charStore.isDead) charStore.showDeathModal = true;
};

interface GenericInstruction {
  type?: string;
  xp?: number;
  hp?: number;
}

const processResponseInstructions = (instructions: unknown[], gameStore: GameStore, charStore: CharacterStore): void => {
  instructions.forEach((item: unknown) => {
    const instr = item as GenericInstruction;
    if (instr.type === 'roll') handleAdditionalRoll(item as RollInstructionMessageDto, gameStore);
    else if (instr.type === 'xp') handleAdditionalXp(item as XpInstructionMessageDto, gameStore, charStore);
    else if (instr.type === 'hp') handleAdditionalHp(item as HpInstructionMessageDto, gameStore, charStore);
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Combat roll helpers
// ─────────────────────────────────────────────────────────────────────────────

const updateCombatStoreFromResponse = (resp: TurnResultWithInstructionsDto | null, combatStore: CombatStore): void => {
  if (!resp) return;
  if (resp.remainingEnemies ?? resp.playerHp ?? resp.roundNumber) {
    try {
      combatStore.updateFromTurnResult(resp);
    } catch {
      // best-effort update
    }
  }
};

const handleDamageEnemyHpDisplay = (resp: TurnResultWithInstructionsDto, targetName: string, gameStore: GameStore): void => {
  if (!Array.isArray(resp.remainingEnemies)) return;
  const updated = resp.remainingEnemies.find(e => e.name === targetName);
  if (!updated) return;
  const hpNow = typeof updated.hp === 'number' ? updated.hp : undefined;
  const hpMax = updated.hpMax ?? undefined;
  if (typeof hpNow !== 'number') return;
  gameStore.appendMessage('system', `🩸 ${targetName} a ${hpNow}${hpMax ? `/${hpMax}` : ''} PV restants`);
  if (hpNow <= 0) gameStore.appendMessage('system', `☠️ ${targetName} est vaincu !`);
};

const processAttackInstructions = (instructions: unknown[], gameStore: GameStore, charStore: CharacterStore): void => {
  instructions.forEach((item: unknown) => {
    const instr = item as RollInstructionWithMeta & { description?: string };
    if (instr.type === 'roll') {
      const pendingInstr: RollInstructionWithMeta = {
        type: 'roll',
        dices: instr.dices,
        modifier: instr.modifier,
        advantage: instr.advantage ?? 'none',
        meta: instr.meta,
        description: instr.description,
      };
      gameStore.pendingInstruction = toStorePendingInstruction(pendingInstr);
      gameStore.appendMessage('system', `🎲 ${instr.description ?? 'Additional roll required'}: ${instr.dices}`);
    } else if (typeof (item as XpInstructionMessageDto).xp === 'number') {
      handleAdditionalXp(item as XpInstructionMessageDto, gameStore, charStore);
    } else if (typeof (item as HpInstructionMessageDto).hp === 'number') {
      handleAdditionalHp(item as HpInstructionMessageDto, gameStore, charStore);
    }
  });
};

const handleAttackRollResponse = async (
  resp: TurnResultWithInstructionsDto,
  gameStore: GameStore,
  charStore: CharacterStore,
): Promise<void> => {
  const combatStore = useCombatStore();
  updateCombatStoreFromResponse(resp, combatStore);

  if (Array.isArray(resp.instructions)) {
    processAttackInstructions(resp.instructions, gameStore, charStore);
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
  gameStore: GameStore,
): Promise<void> => {
  const combatStore = useCombatStore();
  updateCombatStoreFromResponse(resp, combatStore);
  gameStore.appendMessage('system', `💥 Dégâts infligés à ${targetName}: ${damageTotal}`);
  try {
    handleDamageEnemyHpDisplay(resp, targetName, gameStore);
  } catch {
    // best-effort
  }
};

const buildRollData = (rollResult: DiceThrowDto, instr: RollInstructionWithMeta, skillName: string, skillBonus: number) => {
  const meta = instr.meta;
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
// Main composable
// ─────────────────────────────────────────────────────────────────────────────

export const useGameRolls = () => {
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();

  const onDiceRolled = async (rollResult: DiceThrowDto): Promise<void> => {
    if (!gameStore.pendingInstruction || gameStore.pendingInstruction.type !== 'roll') return;
    const instr = gameStore.pendingInstruction as RollInstructionWithMeta;
    const skillName = typeof instr.modifier === 'string' ? instr.modifier : 'Roll';
    const skillBonus = typeof instr.modifier === 'string'
      ? getSkillBonus(characterStore.currentCharacter ?? null, skillName)
      : typeof instr.modifier === 'number' ? instr.modifier : 0;

    gameStore.rollData = buildRollData(rollResult, instr, skillName, skillBonus);
    gameStore.showRollModal = true;
  };

  watch(() => gameStore.latestRoll, (latest) => {
    if (latest) onDiceRolled(latest);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // sendRollResult - refactored into smaller helpers
  // ─────────────────────────────────────────────────────────────────────────────

  const submitCombatRoll = async (
    characterId: string,
    action: string,
    target: string | undefined,
    total: number,
    die: number | undefined,
  ): Promise<void> => {
    const payload: CombatResolvePayload = { action, target, total };
    if (typeof die === 'number') payload.die = die;
    const resp = await combatService.resolveRoll(characterId, payload);
    if (resp?.instructions && Array.isArray(resp.instructions)) {
      processResponseInstructions(resp.instructions, gameStore, characterStore);
    } else {
      gameStore.appendMessage('system', 'Roll submitted to combat');
    }
  };

  const submitNonCombatRoll = async (characterId: string, instr: { type: string; dices: string; modifier: number; description: string }): Promise<void> => {
    const resp = await rollsService.submitRoll(characterId, { instructions: [instr] });
    if (resp?.pendingRolls && Array.isArray(resp.pendingRolls)) {
      processResponseInstructions(resp.pendingRolls, gameStore, characterStore);
    } else {
      gameStore.appendMessage('system', 'Roll submitted');
    }
  };

  const sendRollResult = async (
    rollResult: { rolls: number[]; total: number; bonus: number },
    skillName: string,
    criticalNote: string,
  ): Promise<void> => {
    const characterId = useCharacterStore().currentCharacter?.characterId;
    if (!characterId) {
      gameStore.appendMessage('system', 'No character selected; cannot submit roll.');
      return;
    }

    const pending = gameStore.pendingInstruction as RollInstructionWithMeta | null;
    const action = pending?.meta?.action;
    const isCombatAction = action === 'attack' || action === 'damage';

    try {
      if (isCombatAction && action) {
        const die = extractDieFromRolls(rollResult.rolls);
        await submitCombatRoll(characterId, action, pending?.meta?.target, rollResult.total, die);
      } else {
        const instr = { type: 'roll', dices: skillName || 'roll', modifier: rollResult.bonus, description: `Result: ${JSON.stringify(rollResult)}${criticalNote}` };
        await submitNonCombatRoll(characterId, instr);
      }
    } catch (e) {
      gameStore.appendMessage('system', `Failed to submit roll: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // confirmRoll - refactored into smaller helpers
  // ─────────────────────────────────────────────────────────────────────────────

  const displayRollMessage = (): { diceValue: number; criticalNote: string } | null => {
    const { rolls, bonus, total, skillName } = gameStore.rollData;
    if (!rolls?.length) return null;
    const diceValue = rolls[0];
    const criticalNote = getCriticalNote(diceValue);
    gameStore.appendMessage('system', buildRollMessage(diceValue, bonus ?? 0, skillName ?? '', total ?? 0, criticalNote));
    return { diceValue, criticalNote };
  };

  const handleConfirmAttack = async (pending: RollInstructionWithMeta): Promise<void> => {
    const { rolls, total } = gameStore.rollData;
    const meta = pending.meta;
    const characterId = useCharacterStore().currentCharacter?.characterId;
    if (!characterId) {
      gameStore.appendMessage('system', 'No character selected; cannot resolve attack.');
      return;
    }

    const payload: CombatResolvePayload = { action: 'attack', target: meta?.target, total: total ?? 0 };
    const die = extractDieFromRolls(rolls);
    if (typeof die === 'number') payload.die = die;

    const resp = await combatService.resolveRoll(characterId, payload);
    if (resp) await handleAttackRollResponse(resp, gameStore, characterStore);
  };

  const handleConfirmDamage = async (pending: RollInstructionWithMeta): Promise<void> => {
    const { total } = gameStore.rollData;
    const meta = pending.meta;
    const targetName = meta?.target;
    const damageTotal = total ?? 0;
    const combatStore = useCombatStore();

    const enemy = combatStore.enemies.find(e => e.name === targetName);
    if (!enemy) {
      gameStore.appendMessage('system', `💥 Dégâts: ${damageTotal}`);
      return;
    }

    const characterId = useCharacterStore().currentCharacter?.characterId;
    if (!characterId) return;

    const resp = await combatService.resolveRoll(characterId, { action: 'damage', target: targetName, total: damageTotal });
    if (resp && targetName) await handleDamageRollResponse(resp, targetName, damageTotal, gameStore);
  };

  const handleConfirmNonCombat = async (criticalNote: string): Promise<void> => {
    const { rolls, bonus, total, skillName } = gameStore.rollData;
    await sendRollResult({ rolls: rolls ?? [], total: total ?? 0, bonus: bonus ?? 0 }, skillName ?? '', criticalNote);
  };

  const handleConfirmRollAction = async (pending: RollInstructionWithMeta, criticalNote: string): Promise<void> => {
    const closeModal = (): void => {
      gameStore.pendingInstruction = null;
      gameStore.showRollModal = false;
    };
    const action = pending.meta?.action;
    if (action === 'attack') {
      await handleConfirmAttack(pending);
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

  const confirmRoll = async (): Promise<void> => {
    if (!gameStore.pendingInstruction || gameStore.pendingInstruction.type !== 'roll') return;
    if (gameStore.sending) return;
    gameStore.sending = true;

    try {
      const rollInfo = displayRollMessage();
      if (!rollInfo) return;
      const pending = toRollInstruction(gameStore.pendingInstruction);
      await handleConfirmRollAction(pending, rollInfo.criticalNote);
    } catch (e) {
      gameStore.appendMessage('system', `Failed to send roll result: ${e instanceof Error ? e.message : String(e)}`);
      gameStore.showRollModal = false;
    } finally {
      gameStore.sending = false;
    }
  };

  const rerollDice = async (): Promise<void> => {
    if (!gameStore.pendingInstruction || gameStore.pendingInstruction.type !== 'roll') return;
    const instr = gameStore.pendingInstruction as RollInstructionMessageDto;
    try {
      const payload = await gameStore.doRoll(instr.dices, instr.advantage ?? 'none');
      await onDiceRolled(payload);
    } catch (e) {
      gameStore.appendMessage('system', `Reroll failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return { onDiceRolled, confirmRoll, rerollDice };
};
