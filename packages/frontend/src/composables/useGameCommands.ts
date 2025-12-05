import { conversationService } from '../apis/conversationApi';
import { characterApi } from '../apis/characterApi';
import { isCombatStartInstruction } from '../apis/combatTypes';
import type {
  RollInstructionMessageDto, SpellInstructionMessageDto, CharacterResponseDto, GameInstructionDto,
  InventoryInstructionMessageDto, CombatantDto,
} from '@rpg-gen/shared';
import { useCharacterStore } from '../stores/characterStore';
import { useCombatStore } from '../stores/combatStore';
import { useGameStore } from '../stores/gameStore';
import { parseCommand, type ParsedCommand } from '../utils/chatCommands';
import { useCombat } from './useCombat';

type GameStore = ReturnType<typeof useGameStore>;
type CharacterStore = ReturnType<typeof useCharacterStore>;
type InstructionItem = Record<string, unknown>;

// ----- Instruction Processors -----
const processRollInstruction = (instr: RollInstructionMessageDto, gameStore: GameStore): void => {
  gameStore.pendingInstruction = instr;
  const label = instr.modifierLabel ?? '';
  const value = instr.modifierValue ?? 0;
  const mod = label ? ` (${label})` : (value ? ` + ${value}` : '');
  gameStore.appendMessage('system', `🎲 Roll needed: ${instr.dices}${mod}`);
};

const processXpInstruction = (xp: number, gameStore: GameStore, characterStore: CharacterStore): void => {
  gameStore.appendMessage('system', `✨ Gained ${xp} XP`);
  characterStore.updateXp(xp);
};

// Keep combat HP in sync when an HP instruction arrives while in combat

const processSpellInstruction = (instr: InstructionItem, gameStore: GameStore, characterStore: CharacterStore): void => {
  const spell = instr as {
    action?: string;
    name?: string;
    level?: number;
  };
  const {
    action, name, level,
  } = spell;
  if (action === 'learn') {
    gameStore.appendMessage('system', `📖 Learned spell: ${name} (Level ${level})`);
    characterStore.learnSpell(instr as SpellInstructionMessageDto);
  } else if (action === 'cast') {
    gameStore.appendMessage('system', `✨ Cast spell: ${name}`);
  } else if (action === 'forget') {
    gameStore.appendMessage('system', `🚫 Forgot spell: ${name}`);
    characterStore.forgetSpell(name ?? '');
  }
};

const processInventoryInstruction = (instr: InstructionItem, gameStore: GameStore, characterStore: CharacterStore): void => {
  const inventory = instr as {
    action?: string;
    name?: string;
    quantity?: number;
  };
  const {
    action, name, quantity = 1,
  } = inventory;
  if (action === 'add') {
    gameStore.appendMessage('system', `🎒 Added to inventory: ${name} (x${quantity})`);
    characterStore.addInventoryItem({
      name: name ?? '',
      qty: quantity,
    });
  } else if (action === 'remove') {
    gameStore.appendMessage('system', `🗑️ Removed from inventory: ${name} (x${quantity})`);
    characterStore.removeInventoryItem(name ?? '', quantity);
  } else if (action === 'use') {
    gameStore.appendMessage('system', `⚡ Used item: ${name}`);
    characterStore.useInventoryItem(name ?? '');
  }
};

// ----- Command Helpers -----
const findSpell = (character: CharacterResponseDto, spellName: string) => character.spells?.find((s: { name: string }) => s.name.toLowerCase() === spellName.toLowerCase());

const matchesName = (value: string | undefined, search: string): boolean => (value ?? '').toLowerCase() === search.toLowerCase();

const findItem = (character: CharacterResponseDto, itemName: string) => character.inventory?.find((i: {
  name?: string;
  definitionId?: string;
  _id?: string;
}) => matchesName(i.name, itemName) || matchesName(i.definitionId, itemName) || matchesName(i._id, itemName));

// eslint-disable-next-line max-statements
export function useGameCommands() {
  const gameStore = useGameStore();
  const characterStore = useCharacterStore();
  const combatStore = useCombatStore();
  const combat = useCombat();

  const syncHpToCombatIfNeeded = (hp: number) => {
    if (!combatStore.inCombat) return;
    if (!combatStore.player) return;
    // Apply delta
    const newHp = Math.max(0, (combatStore.player.hp ?? 0) + (hp ?? 0));
    combatStore.player = {
      ...combatStore.player,
      hp: newHp,
    };
  };

  const processHpInstruction = (hp: number, gameStore: GameStore, characterStore: CharacterStore): void => {
    const hpChange = hp > 0 ? `+${hp}` : hp;
    gameStore.appendMessage('system', `❤️ HP changed: ${hpChange}`);
    characterStore.updateHp(hp);
    syncHpToCombatIfNeeded(hp);
    if (characterStore.isDead) characterStore.showDeathModal = true;
  };
  const sendToGemini = async (
    message: string,
    instructions: GameInstructionDto[] = [],
  ): Promise<void> => {
    const response = await conversationService.sendMessage(message, instructions);
    gameStore.messages.pop();
    gameStore.appendMessage('assistant', response.narrative);
    processInstructions(response.instructions ?? []);
  };

  const executeWithLoading = async (action: () => Promise<void>, errorPrefix: string): Promise<void> => {
    gameStore.sending = true;
    try {
      await action();
    } catch (e) {
      gameStore.appendMessage('system', `❌ ${errorPrefix} (${e instanceof Error ? e.message : String(e)})`);
    } finally {
      gameStore.sending = false;
    }
  };

  /**
   * Insert a command into the chat input
   */
  const insertCommand = (command: string) => {
    gameStore.playerText = command;
  };

  /**
   * Execute a parsed command
   */
  const executeCommand = async (command: ParsedCommand): Promise<void> => {
    const character = characterStore.currentCharacter;
    if (!character) return;

    const target = combatStore.aliveEnemies.find(e => e.id.toLocaleLowerCase() === command.target.toLowerCase());
    switch (command.type) {
      case 'cast':
        await executeCastCommand(command.target);
        break;
      case 'use':
        await executeUseCommand(command.target);
        break;
      case 'equip':
        await executeEquipCommand(command.target);
        break;
      case 'attack':
        if (!target) throw new Error(`Enemy not found: ${command.target} maybe name is used instead of id`);
        await executeAttackCommand(target);
        break;
    }
  };

  /**
   * Execute a cast spell command
   */
  const executeCastCommand = async (spellName: string): Promise<void> => {
    const character = characterStore.currentCharacter;
    if (!character) return;

    const spell = findSpell(character, spellName);
    if (!spell) {
      gameStore.appendMessage('system', `❌ Spell not found: ${spellName}`);
      return;
    }

    gameStore.appendMessage('user', `I cast ${spell.name}!`);
    gameStore.appendMessage('system', '...thinking...');
    gameStore.sending = true;

    try {
      await sendToGemini(`I cast the spell ${spell.name}`, [
        {
          type: 'spell',
          action: 'cast',
          name: spell.name,
          description: spell.description,
          level: spell.level,
        } as SpellInstructionMessageDto,
      ]);
    } catch {
      gameStore.messages.pop();
      gameStore.appendMessage('system', `❌ Failed to cast spell: ${spell.name}`);
    } finally {
      gameStore.sending = false;
    }
  };

  /**
   * Execute a use item command
   */
  const executeUseCommand = async (itemName: string): Promise<void> => {
    const character = characterStore.currentCharacter;
    if (!character) return;

    const item = findItem(character, itemName);
    if (!item) {
      gameStore.appendMessage('system', `❌ Item not found: ${itemName}`);
      return;
    }

    gameStore.appendMessage('user', `I use ${item.name}!`);
    gameStore.appendMessage('system', '...thinking...');
    gameStore.sending = true;

    try {
      await sendToGemini(`I use the item ${item.name}`, [
        {
          type: 'inventory',
          action: 'use',
          name: item._id,
        } as InventoryInstructionMessageDto,
      ]);
    } catch {
      gameStore.messages.pop();
      gameStore.appendMessage('system', `❌ Failed to use item: ${item.name}`);
    } finally {
      gameStore.sending = false;
    }
  };

  /**
   * Execute an equip item command
   */
  const findEquippableItem = (character: CharacterResponseDto, itemName: string) => {
    const item = character.inventory?.find(i => (i.name ?? '').toLowerCase() === itemName.toLowerCase());
    if (!item) return { error: `❌ Item not found: ${itemName}` };
    if (!item.definitionId) return { error: `❌ Cannot equip ${item.name}: no definitionId available` };
    return { item };
  };

  const executeEquipCommand = async (itemName: string): Promise<void> => {
    const character = characterStore.currentCharacter;
    if (!character) return;

    const result = findEquippableItem(character, itemName);
    if (result.error) {
      gameStore.appendMessage('system', result.error);
      return;
    }
    const item = result.item!;
    gameStore.appendMessage('user', `Equip ${item.name} (${item.definitionId})`);
    gameStore.appendMessage('system', 'Equipping...');

    await executeWithLoading(async () => {
      const updated = await characterApi.equipInventoryItem(character.characterId, item.definitionId!);
      characterStore.currentCharacter = updated;
      gameStore.appendMessage('system', `✅ Equipped ${item.name}`);
    }, `Failed to equip item: ${item.name}`);
  };

  /**
   * Execute an attack command - uses backend combat system when in combat
   */
  const executeAttackCommand = async (target: CombatantDto): Promise<void> => {
    const character = characterStore.currentCharacter;
    if (!character) return;

    const isInCombat = combatStore.inCombat || await combat.checkCombatStatus();
    if (isInCombat) {
      await combat.executeAttack(target);
      return;
    }

    gameStore.appendMessage('user', `J'attaque ${target}!`);
    gameStore.appendMessage('system', '...thinking...');
    gameStore.sending = true;
  };

  /**
   * Process game instructions from the response
   */
  const processInstructions = (instructions: unknown[]): void => {
    if (!Array.isArray(instructions)) return;

    instructions.forEach((item: unknown) => {
      const instr = item as InstructionItem;
      const type = instr.type as string | undefined;

      if (type === 'roll') {
        processRollInstruction(instr as RollInstructionMessageDto, gameStore);
      } else if (type === 'xp' && typeof instr.xp === 'number') {
        processXpInstruction(instr.xp, gameStore, characterStore);
      } else if (type === 'hp' && typeof instr.hp === 'number') {
        processHpInstruction(instr.hp, gameStore, characterStore);
      } else if (type === 'spell' && typeof instr.name === 'string') {
        processSpellInstruction(instr, gameStore, characterStore);
      } else if (type === 'inventory' && typeof instr.name === 'string') {
        processInventoryInstruction(instr, gameStore, characterStore);
      } else if (isCombatStartInstruction(item)) {
        combat.initializeCombat(item);
      }
    });
  };

  /**
   * Handle input that might be a command or a regular message
   * Returns true if it was a command that was handled
   */
  const handleInput = async (input: string): Promise<boolean> => {
    const command = parseCommand(input);
    if (command) {
      await executeCommand(command);
      return true;
    }
    return false;
  };

  return {
    insertCommand,
    executeCommand,
    handleInput,
  };
}
