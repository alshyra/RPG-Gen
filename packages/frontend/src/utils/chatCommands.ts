/**
 * Chat command parser utility
 * Parses commands like /cast spell1, /equip sword, /attack target, /use item
 */

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

const COMMAND_REGEX = /^\/(\w+)\s+(.+)$/;

const VALID_COMMANDS: CommandType[] = ['cast', 'equip', 'attack', 'use'];

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
export function getCommandSuggestions(input: string): CommandDefinition[] {
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
}

/**
 * Check if the input is a valid chat command
 */
export function isCommand(input: string): boolean {
  return input.startsWith('/');
}

/**
 * Parse a chat command string into a structured command object
 * @param input - The raw input string (e.g., "/cast fireball")
 * @returns ParsedCommand if valid, null otherwise
 */
export function parseCommand(input: string): ParsedCommand | null {
  const trimmed = input.trim();
  if (!isCommand(trimmed)) {
    return null;
  }

  const match = trimmed.match(COMMAND_REGEX);
  if (!match) {
    return null;
  }

  const [, commandType, target] = match;
  const type = commandType.toLowerCase();

  if (!VALID_COMMANDS.includes(type as CommandType)) {
    return null;
  }

  return {
    type: type as CommandType,
    target: target.trim(),
  };
}

/**
 * Generate a command string for using an item
 */
export function generateUseCommand(itemName: string): string {
  return `/use ${itemName}`;
}

/**
 * Generate a command string for casting a spell
 */
export function generateCastCommand(spellName: string): string {
  return `/cast ${spellName}`;
}

/**
 * Generate a command string for equipping an item
 */
export function generateEquipCommand(itemName: string): string {
  return `/equip ${itemName}`;
}

/**
 * Generate a command string for attacking a target
 */
export function generateAttackCommand(target: string): string {
  return `/attack ${target}`;
}
