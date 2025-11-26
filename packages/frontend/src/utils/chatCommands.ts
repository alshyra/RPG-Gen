/**
 * Chat command parser utility
 * Parses commands like /cast spell1, /equip sword, /attack target, /use item
 */

export type CommandType = 'cast' | 'equip' | 'attack' | 'use';

export interface ParsedCommand {
  type: CommandType;
  target: string;
}

const COMMAND_REGEX = /^\/(\w+)\s+(.+)$/;

const VALID_COMMANDS: CommandType[] = ['cast', 'equip', 'attack', 'use'];

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
