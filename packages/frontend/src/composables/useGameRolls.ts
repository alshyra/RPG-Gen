import type {
  DiceThrowDto,
  RollInstructionMessageDto,
  TurnResultWithInstructionsDto,
} from '@rpg-gen/shared';
import {
  isRollInstruction, isXpInstruction, isHpInstruction,
  type GameInstructionDto, type HpInstructionMessageDto, type XpInstructionMessageDto,
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

// ─────────────────────────────────────────────────────────────────────────────
// Pure helper functions
// ─────────────────────────────────────────────────────────────────────────────

function getCriticalNote(diceValue: number): string {
  if (diceValue === 20) return ' (CRITICAL SUCCESS - Natural 20!)';
  if (diceValue === 1) return ' (CRITICAL FAILURE - Natural 1!)';
  return '';
}

function buildRollMessage(
  diceValue: number,
  bonus: number,
  skillName: string,
  total: number,
  criticalNote: string,
): string {
  const bonusPart = bonus !== 0 ? ` + ${bonus}` : '';
  return `Rolled: [${diceValue}] = ${diceValue}${bonusPart} (${skillName}) = **${total}**${criticalNote}`;
}

function buildModifierLabel(modifier: string | number | undefined): string {
  if (typeof modifier === 'number') return ` +${modifier}`;
  if (typeof modifier === 'string') return ` (${modifier})`;
  return '';
}

function buildAdvantageLabel(advantage: string | undefined): string {
  if (advantage === 'advantage') return ' (ADVANTAGE ↑)';
  if (advantage === 'disadvantage') return ' (DISADVANTAGE ↓)';
  return '';
}

function buildAttackMessage(
  instr: RollInstructionMessageDto,
  modLabel: string,
  advLabel: string,
): string {
  const { meta } = instr;
  const targetPart = meta?.target ? ` vs ${meta.target}` : '';
  const acPart = typeof meta?.targetAc === 'number' ? ` (AC ${meta.targetAc})` : '';
  let message = `⚔️ Attack roll${targetPart}${acPart}: ${instr.dices}${modLabel}${advLabel}`;
  if (meta?.damageDice) {
    const bonusPart = meta.damageBonus ? ` +${meta.damageBonus}` : '';
    message += ` — if hit: damage ${meta.damageDice}${bonusPart}`;
  }
  return message;
}

function buildRollNeededMessage(instr: RollInstructionMessageDto): string {
  const modLabel = buildModifierLabel(instr.modifier);
  const advLabel = buildAdvantageLabel(instr.advantage);
  const { meta } = instr;
  if (meta?.action === 'attack') return buildAttackMessage(instr, modLabel, advLabel);
  if (meta?.action === 'damage') {
    return `💥 Damage roll for ${meta.target ?? 'target'}: ${instr.dices}${modLabel}`;
  }
  return `🎲 Roll needed: ${instr.dices}${modLabel}${advLabel}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Instruction handlers (side-effecting)
// ─────────────────────────────────────────────────────────────────────────────

function handleAdditionalRoll(instr: RollInstructionMessageDto, gameStore: GameStore): void {
  gameStore.pendingInstruction = instr;
  gameStore.appendMessage('system', buildRollNeededMessage(instr));
}

function handleAdditionalXp(instr: XpInstructionMessageDto, gameStore: GameStore, charStore: CharacterStore): void {
  gameStore.appendMessage('system', `✨ Gained ${instr.xp} XP`);
  charStore.updateXp(instr.xp);
}

function handleAdditionalHp(instr: HpInstructionMessageDto, gameStore: GameStore, charStore: CharacterStore): void {
  const hpChange = instr.hp > 0 ? `+${instr.hp}` : String(instr.hp);
  gameStore.appendMessage('system', `❤️ HP changed: ${hpChange}`);
  charStore.updateHp(instr.hp);
  if (charStore.isDead) charStore.showDeathModal = true;
}

function processSingleInstruction(
  instr: GameInstructionDto,
  gameStore: GameStore,
  charStore: CharacterStore,
): void {
  if (isRollInstruction(instr)) handleAdditionalRoll(instr, gameStore);
  else if (isXpInstruction(instr)) handleAdditionalXp(instr, gameStore, charStore);
  else if (isHpInstruction(instr)) handleAdditionalHp(instr, gameStore, charStore);
}

function processResponseInstructions(
  instructions: GameInstructionDto[],
  gameStore: GameStore,
  charStore: CharacterStore,
): void {
  instructions.forEach(instr => processSingleInstruction(instr, gameStore, charStore));
}

// ─────────────────────────────────────────────────────────────────────────────
// Combat roll helpers
// ─────────────────────────────────────────────────────────────────────────────

function updateCombatStoreFromResponse(resp: TurnResultWithInstructionsDto | null, combatStore: CombatStore): void {
  if (!resp) return;
  if (resp.remainingEnemies ?? resp.playerHp ?? resp.roundNumber) {
    try {
      combatStore.updateFromTurnResult(resp);
    } catch {
      // best-effort update
    }
  }
}

function handleDamageEnemyHpDisplay(
  resp: TurnResultWithInstructionsDto,
  targetName: string,
  gameStore: GameStore,
): void {
  if (!Array.isArray(resp.remainingEnemies)) return;
  const updated = resp.remainingEnemies.find(e => e.name === targetName);
  if (!updated) return;
  const hpNow = typeof updated.hp === 'number' ? updated.hp : undefined;
  const hpMax = updated.hpMax ?? undefined;
  if (typeof hpNow !== 'number') return;
  gameStore.appendMessage('system', `🩸 ${targetName} a ${hpNow}${hpMax ? `/${hpMax}` : ''} PV restants`);
  if (hpNow <= 0) gameStore.appendMessage('system', `☠️ ${targetName} est vaincu !`);
}

function processSingleAttackInstruction(
  instr: GameInstructionDto,
  gameStore: GameStore,
  charStore: CharacterStore,
): void {
  if (isRollInstruction(instr)) {
    gameStore.pendingInstruction = instr;
    gameStore.appendMessage('system', `🎲 ${instr.description ?? 'Additional roll required'}: ${instr.dices}`);
  } else if (isXpInstruction(instr)) {
    handleAdditionalXp(instr, gameStore, charStore);
  } else if (isHpInstruction(instr)) {
    handleAdditionalHp(instr, gameStore, charStore);
  }
}

function processAttackInstructions(
  instructions: GameInstructionDto[],
  gameStore: GameStore,
  charStore: CharacterStore,
): void {
  instructions.forEach(instr => processSingleAttackInstruction(instr, gameStore, charStore));
}

async function handleAttackRollResponse(
  resp: TurnResultWithInstructionsDto,
  gameStore: GameStore,
  charStore: CharacterStore,
): Promise<void> {
  const combatStore = useCombatStore();
  updateCombatStoreFromResponse(resp, combatStore);

  if (resp.instructions && resp.instructions.length > 0) {
    processAttackInstructions(resp.instructions, gameStore, charStore);
  }
  if (resp.narrative) gameStore.appendMessage('assistant', resp.narrative);

  // Hide modal if no further rolls needed
  if (!resp.instructions?.length) {
    gameStore.pendingInstruction = null;
    gameStore.showRollModal = false;
  }
}

async function handleDamageRollResponse(
  resp: TurnResultWithInstructionsDto,
  targetName: string,
  damageTotal: number,
  gameStore: GameStore,
): Promise<void> {
  const combatStore = useCombatStore();
  updateCombatStoreFromResponse(resp, combatStore);
  gameStore.appendMessage('system', `💥 Dégâts infligés à ${targetName}: ${damageTotal}`);
  try {
    handleDamageEnemyHpDisplay(resp, targetName, gameStore);
  } catch {
    // best-effort
  }
}

function buildRollData(
  rollResult: DiceThrowDto,
  instr: RollInstructionMessageDto,
  skillName: string,
  skillBonus: number,
) {
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
}

// ─────────────────────────────────────────────────────────────────────────────
// Store context type for helpers
// ─────────────────────────────────────────────────────────────────────────────
interface StoreContext {
  gameStore: GameStore;
  characterStore: CharacterStore;
  combatStore: CombatStore;
}

// ─────────────────────────────────────────────────────────────────────────────
// Roll submission helpers (module-level)
// ─────────────────────────────────────────────────────────────────────────────

async function submitCombatRoll(
  ctx: StoreContext,
  characterId: string,
  total: number,
  rolls: number[],
): Promise<void> {
  const { actionToken } = ctx.combatStore;
  if (!actionToken) {
    ctx.gameStore.appendMessage('system', 'No action token available for combat roll');
    return;
  }
  const payload: DiceThrowDto = {
    rolls,
    mod: 0,
    total,
  };
  const resp = await combatService.resolveRollWithToken(characterId, actionToken, payload);
  if (resp?.instructions && resp.instructions.length > 0) {
    processResponseInstructions(resp.instructions, ctx.gameStore, ctx.characterStore);
  } else {
    ctx.gameStore.appendMessage('system', 'Roll submitted to combat');
  }
}

async function submitNonCombatRoll(
  ctx: StoreContext,
  characterId: string,
  instr: { type: string;
    dices: string;
    modifier: number;
    description: string; },
): Promise<void> {
  const resp = await rollsService.submitRoll(characterId, { instructions: [instr] });
  if (resp?.pendingRolls && Array.isArray(resp.pendingRolls)) {
    resp.pendingRolls.forEach(item => processSingleInstruction(item, ctx.gameStore, ctx.characterStore));
  } else {
    ctx.gameStore.appendMessage('system', 'Roll submitted');
  }
}

async function sendRollResult(
  ctx: StoreContext,
  rollResult: { rolls: number[];
    total: number;
    bonus: number; },
  skillName: string,
  criticalNote: string,
): Promise<void> {
  const characterId = ctx.characterStore.currentCharacter?.characterId;
  if (!characterId) {
    ctx.gameStore.appendMessage('system', 'No character selected; cannot submit roll.');
    return;
  }
  const pending = ctx.gameStore.pendingInstruction;
  const action = pending && isRollInstruction(pending) ? pending.meta?.action : undefined;
  const isCombatAction = action === 'attack' || action === 'damage';
  try {
    if (isCombatAction) {
      await submitCombatRoll(ctx, characterId, rollResult.total, rollResult.rolls);
    } else {
      const instr = {
        type: 'roll',
        dices: skillName || 'roll',
        modifier: rollResult.bonus,
        description: `Result: ${JSON.stringify(rollResult)}${criticalNote}`,
      };
      await submitNonCombatRoll(ctx, characterId, instr);
    }
  } catch (e) {
    ctx.gameStore.appendMessage('system', `Failed to submit roll: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm roll helpers (module-level)
// ─────────────────────────────────────────────────────────────────────────────

function displayRollMessage(gameStore: GameStore): { diceValue: number;
  criticalNote: string; } | null {
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
}

async function handleConfirmAttack(ctx: StoreContext): Promise<void> {
  const {
    rolls, total,
  } = ctx.gameStore.rollData;
  const characterId = ctx.characterStore.currentCharacter?.characterId;
  const { actionToken } = ctx.combatStore;
  if (!characterId || !actionToken) {
    ctx.gameStore.appendMessage('system', 'No character or action token; cannot resolve attack.');
    return;
  }
  const payload: DiceThrowDto = {
    rolls: rolls ?? [],
    mod: 0,
    total: total ?? 0,
  };
  const resp = await combatService.resolveRollWithToken(characterId, actionToken, payload);
  if (resp) await handleAttackRollResponse(resp, ctx.gameStore, ctx.characterStore);
}

async function handleConfirmDamage(ctx: StoreContext, pending: RollInstructionMessageDto): Promise<void> {
  const {
    total, rolls,
  } = ctx.gameStore.rollData;
  const { meta } = pending;
  const targetName = meta?.target;
  const damageTotal = total ?? 0;
  const enemy = ctx.combatStore.enemies.find(e => e.name === targetName);
  if (!enemy) {
    ctx.gameStore.appendMessage('system', `💥 Dégâts: ${damageTotal}`);
    return;
  }
  const characterId = ctx.characterStore.currentCharacter?.characterId;
  const { actionToken } = ctx.combatStore;
  if (!characterId || !actionToken) return;
  const payload: DiceThrowDto = {
    rolls: rolls ?? [],
    mod: 0,
    total: damageTotal,
  };
  const resp = await combatService.resolveRollWithToken(characterId, actionToken, payload);
  if (resp && targetName) {
    await handleDamageRollResponse(resp, targetName, damageTotal, ctx.gameStore);
  }
}

async function handleConfirmNonCombat(ctx: StoreContext, criticalNote: string): Promise<void> {
  const {
    rolls, bonus, total, skillName,
  } = ctx.gameStore.rollData;
  await sendRollResult(
    ctx,
    {
      rolls: rolls ?? [],
      total: total ?? 0,
      bonus: bonus ?? 0,
    },
    skillName ?? '',
    criticalNote,
  );
}

async function handleConfirmRollAction(
  ctx: StoreContext,
  pending: RollInstructionMessageDto,
  criticalNote: string,
): Promise<void> {
  const closeModal = (): void => {
    ctx.gameStore.pendingInstruction = null;
    ctx.gameStore.showRollModal = false;
  };
  const action = pending.meta?.action;
  if (action === 'attack') {
    await handleConfirmAttack(ctx);
    return;
  }
  if (action === 'damage') {
    await handleConfirmDamage(ctx, pending);
    closeModal();
    return;
  }
  await handleConfirmNonCombat(ctx, criticalNote);
  closeModal();
}

// ─────────────────────────────────────────────────────────────────────────────
// Main composable
// ─────────────────────────────────────────────────────────────────────────────

export function useGameRolls() {
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  const combatStore = useCombatStore();
  const ctx: StoreContext = {
    gameStore,
    characterStore,
    combatStore,
  };

  async function onDiceRolled(rollResult: DiceThrowDto): Promise<void> {
    const pending = gameStore.pendingInstruction;
    if (!pending || !isRollInstruction(pending)) return;
    const skillName = typeof pending.modifier === 'string' ? pending.modifier : 'Roll';
    const skillBonus = typeof pending.modifier === 'string'
      ? getSkillBonus(characterStore.currentCharacter ?? null, skillName)
      : typeof pending.modifier === 'number' ? pending.modifier : 0;
    gameStore.rollData = buildRollData(rollResult, pending, skillName, skillBonus);
    gameStore.showRollModal = true;
  }

  watch(() => gameStore.latestRoll, latest => latest && onDiceRolled(latest));

  async function confirmRoll(): Promise<void> {
    const pending = gameStore.pendingInstruction;
    if (!pending || !isRollInstruction(pending) || gameStore.sending) return;
    gameStore.sending = true;
    try {
      const rollInfo = displayRollMessage(gameStore);
      if (rollInfo) await handleConfirmRollAction(ctx, pending, rollInfo.criticalNote);
    } catch (e) {
      gameStore.appendMessage('system', `Failed to send roll result: ${e instanceof Error ? e.message : String(e)}`);
      gameStore.showRollModal = false;
    } finally {
      gameStore.sending = false;
    }
  }

  async function rerollDice(): Promise<void> {
    const pending = gameStore.pendingInstruction;
    if (!pending || !isRollInstruction(pending)) return;
    try {
      const payload = await gameStore.doRoll(pending.dices, pending.advantage ?? 'none');
      await onDiceRolled(payload);
    } catch (e) {
      gameStore.appendMessage('system', `Reroll failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return {
    onDiceRolled,
    confirmRoll,
    rerollDice,
  };
}
