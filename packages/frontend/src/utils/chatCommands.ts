/**
 * Chat command parser utility
 * Parses commands like /cast spell1, /equip sword, /attack target, /use item
 */

import type { ItemDto, SpellDto } from '@rpg-gen/shared';

export type CommandType = 'cast' | 'equip' | 'attack' | 'use';

export interface ParsedCommand {
  type: CommandType;
  target: string;
}

export interface CommandDefinition {
  command: CommandType;
  description: string;
  usage: string;
}

export interface ArgumentSuggestion {
  name: string;
  description?: string;
  type: 'spell' | 'item';
}

export type SuggestionType = 'command' | 'argument';

export interface SuggestionResult {
  type: SuggestionType;
  commandSuggestions: CommandDefinition[];
  argumentSuggestions: ArgumentSuggestion[];
  activeCommand?: CommandType;
}

const COMMAND_REGEX = /^\/(\w+)\s+(.+)$/;
const COMMAND_WITH_SPACE_REGEX = /^\/(\w+)\s*(.*)$/;

const VALID_COMMANDS: CommandType[] = [
  'cast',
  'equip',
  'attack',
  'use',
];

/**
 * Available commands with their descriptions for autocompletion
 * (ordered consistently with VALID_COMMANDS)
 */
export const COMMAND_DEFINITIONS: CommandDefinition[] = [
  { command: 'cast', description: 'Lancer un sort', usage: '/cast <sort>' },
  { command: 'equip', description: 'Équiper un objet', usage: '/equip <objet>' },
  { command: 'attack', description: 'Attaquer une cible', usage: '/attack <cible>' },
  { command: 'use', description: 'Utiliser un objet', usage: '/use <objet>' },
];

/**
 * Get command suggestions that match the input
 * @param input - The partial input (e.g., "/ca" or "/")
 * @returns Array of matching command definitions
 */
export const getCommandSuggestions = (input: string): CommandDefinition[] => {
  const trimmed = input.trim().toLowerCase();

  // Only provide suggestions if input starts with /
  if (!trimmed.startsWith('/')) {
    return [];
  }

  // Remove the leading slash and get the partial command
  const partial = trimmed.slice(1);

  // If empty after slash, return all commands
  if (partial === '') {
    return COMMAND_DEFINITIONS;
  }

  // Check if input contains a space (command has argument)
  if (partial.includes(' ')) {
    return [];
  }

  // Filter commands that start with the partial input
  return COMMAND_DEFINITIONS.filter(def =>
    def.command.startsWith(partial),
  );
};

/**
 * Parse the current command from input to determine what type of argument is expected
 */
export const parseActiveCommand = (input: string): { command: CommandType | null; argumentPartial: string } => {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed.startsWith('/')) {
    return { command: null, argumentPartial: '' };
  }

  const match = trimmed.match(COMMAND_WITH_SPACE_REGEX);
  if (!match) {
    return { command: null, argumentPartial: '' };
  }

  const [
    , commandType,
    arg,
  ] = match;
  const type = commandType.toLowerCase();

  if (!VALID_COMMANDS.includes(type as CommandType)) {
    return { command: null, argumentPartial: '' };
  }

  return {
    command: type as CommandType,
    argumentPartial: arg || '',
  };
};

/**
 * Get argument suggestions based on the active command and available spells/items
 * @param command - The active command type
 * @param partialArg - Partial argument text for filtering
 * @param spells - Available spells
 * @param inventory - Available inventory items
 * @param characterLevel - Character's total level (for spell filtering)
 */
export const getArgumentSuggestions = (
  command: CommandType,
  partialArg: string,
  spells: SpellDto[] = [],
  inventory: ItemDto[] = [],
  characterLevel: number = 1,
): ArgumentSuggestion[] => {
  const partial = partialArg.toLowerCase();

  switch (command) {
    case 'cast':
      // Filter spells by character level (spell level must be <= character level)
      return spells
        .filter((spell) => {
          const spellLevel = spell.level || 0;
          const matchesName = spell.name.toLowerCase().includes(partial);
          const matchesLevel = spellLevel <= characterLevel;
          return matchesName && matchesLevel;
        })
        .map(spell => ({
          name: spell.name,
          description: spell.description || `Niveau ${spell.level || 0}`,
          type: 'spell' as const,
        }));

    case 'use':
      // Only show usable/consumable items for /use command
      return inventory
        .filter((item) => {
          const isUsable = !!item.meta?.usable || !!item.meta?.consumable;
          const matchesName = (item.name ?? '').toLowerCase().includes(partial);
          return isUsable && matchesName;
        })
        .filter(item => item.name !== undefined)
        .map(item => ({
          name: item.name!,
          description: item.description || ((item.qty ?? 1) > 1 ? `x${item.qty}` : undefined),
          type: 'item' as const,
        }));

    case 'equip':
      // Show all items for /equip command
      return inventory
        .filter(item => (item.name ?? '').toLowerCase().includes(partial))
        .filter(item => item.name !== undefined)
        .map(item => ({
          name: item.name!,
          description: item.description || ((item.qty ?? 1) > 1 ? `x${item.qty}` : undefined),
          type: 'item' as const,
        }));

    case 'attack':
      // For attack, we don't have a list of targets, so no suggestions
      return [];

    default:
      return [];
  }
};

/**
 * Get all suggestions (commands or arguments) based on the input and character data
 * @param input - The current input text
 * @param spells - Available spells
 * @param inventory - Available inventory items
 * @param characterLevel - Character's total level (for spell filtering)
 */
export const getAllSuggestions = (
  input: string,
  spells: SpellDto[] = [],
  inventory: ItemDto[] = [],
  characterLevel: number = 1,
): SuggestionResult => {
  const trimmed = input.trim();

  // Not a command
  if (!trimmed.startsWith('/')) {
    return {
      type: 'command',
      commandSuggestions: [],
      argumentSuggestions: [],
    };
  }

  // Check if original input has a space after command (before trimming argument)
  const hasSpaceAfterCommand = /^\/\w+\s/.test(input);

  // Just "/" or partial command without space - show command suggestions
  if (!hasSpaceAfterCommand) {
    return {
      type: 'command',
      commandSuggestions: getCommandSuggestions(input),
      argumentSuggestions: [],
    };
  }

  // Command with space - check for argument suggestions
  const { command, argumentPartial } = parseActiveCommand(input);

  if (command) {
    const argumentSuggestions = getArgumentSuggestions(command, argumentPartial, spells, inventory, characterLevel);
    return {
      type: 'argument',
      commandSuggestions: [],
      argumentSuggestions,
      activeCommand: command,
    };
  }

  return {
    type: 'command',
    commandSuggestions: [],
    argumentSuggestions: [],
  };
};

/**
 * Check if the input is a valid chat command
 */
export const isCommand = (input: string): boolean => input.startsWith('/');

/**
 * Parse a chat command string into a structured command object
 * @param input - The raw input string (e.g., "/cast fireball")
 * @returns ParsedCommand if valid, null otherwise
 */
export const parseCommand = (input: string): ParsedCommand | null => {
  const trimmed = input.trim();
  if (!isCommand(trimmed)) {
    return null;
  }

  const match = trimmed.match(COMMAND_REGEX);
  if (!match) {
    return null;
  }

  const [
    , commandType,
    target,
  ] = match;
  const type = commandType.toLowerCase();

  if (!VALID_COMMANDS.includes(type as CommandType)) {
    return null;
  }

  return {
    type: type as CommandType,
    target: target.trim(),
  };
};

/**
 * Generate a command string for using an item
 */
export const generateUseCommand = (itemName: string): string => `/use ${itemName}`;

/**
 * Generate a command string for casting a spell
 */
export const generateCastCommand = (spellName: string): string => `/cast ${spellName}`;

/**
 * Generate a command string for equipping an item
 */
export const generateEquipCommand = (itemName: string): string => `/equip ${itemName}`;

/**
 * Generate a command string for attacking a target
 */
export const generateAttackCommand = (target: string): string => `/attack ${target}`;
