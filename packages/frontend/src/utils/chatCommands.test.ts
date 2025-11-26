import { describe, it, expect } from 'vitest';
import {
  isCommand,
  parseCommand,
  generateUseCommand,
  generateCastCommand,
  generateEquipCommand,
  generateAttackCommand,
  getCommandSuggestions,
  getArgumentSuggestions,
  getAllSuggestions,
  parseActiveCommand,
  COMMAND_DEFINITIONS,
} from './chatCommands';

describe('chatCommands', () => {
  describe('isCommand', () => {
    it('returns true for strings starting with /', () => {
      expect(isCommand('/cast fireball')).toBe(true);
      expect(isCommand('/use potion')).toBe(true);
    });

    it('returns false for regular messages', () => {
      expect(isCommand('Hello world')).toBe(false);
      expect(isCommand('I want to cast fireball')).toBe(false);
    });
  });

  describe('parseCommand', () => {
    it('parses /cast command', () => {
      const result = parseCommand('/cast fireball');
      expect(result).toEqual({ type: 'cast', target: 'fireball' });
    });

    it('parses /use command', () => {
      const result = parseCommand('/use health potion');
      expect(result).toEqual({ type: 'use', target: 'health potion' });
    });

    it('parses /equip command', () => {
      const result = parseCommand('/equip sword');
      expect(result).toEqual({ type: 'equip', target: 'sword' });
    });

    it('parses /attack command', () => {
      const result = parseCommand('/attack goblin');
      expect(result).toEqual({ type: 'attack', target: 'goblin' });
    });

    it('is case insensitive for command type', () => {
      expect(parseCommand('/CAST fireball')).toEqual({ type: 'cast', target: 'fireball' });
      expect(parseCommand('/Use potion')).toEqual({ type: 'use', target: 'potion' });
    });

    it('returns null for invalid commands', () => {
      expect(parseCommand('/invalid command')).toBeNull();
      expect(parseCommand('/jump high')).toBeNull();
    });

    it('returns null for commands without target', () => {
      expect(parseCommand('/cast')).toBeNull();
      expect(parseCommand('/use')).toBeNull();
    });

    it('returns null for non-command strings', () => {
      expect(parseCommand('hello world')).toBeNull();
      expect(parseCommand('')).toBeNull();
    });

    it('handles whitespace correctly', () => {
      expect(parseCommand('  /cast fireball  ')).toEqual({ type: 'cast', target: 'fireball' });
      expect(parseCommand('/use   health potion')).toEqual({ type: 'use', target: 'health potion' });
    });
  });

  describe('command generators', () => {
    it('generates use command', () => {
      expect(generateUseCommand('health potion')).toBe('/use health potion');
    });

    it('generates cast command', () => {
      expect(generateCastCommand('fireball')).toBe('/cast fireball');
    });

    it('generates equip command', () => {
      expect(generateEquipCommand('sword')).toBe('/equip sword');
    });

    it('generates attack command', () => {
      expect(generateAttackCommand('goblin')).toBe('/attack goblin');
    });
  });

  describe('getCommandSuggestions', () => {
    it('returns all commands when input is just /', () => {
      const suggestions = getCommandSuggestions('/');
      expect(suggestions).toHaveLength(COMMAND_DEFINITIONS.length);
      expect(suggestions).toEqual(COMMAND_DEFINITIONS);
    });

    it('returns matching commands for partial input', () => {
      const suggestions = getCommandSuggestions('/ca');
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].command).toBe('cast');
    });

    it('returns multiple matches when applicable', () => {
      const suggestions = getCommandSuggestions('/a');
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].command).toBe('attack');
    });

    it('returns empty array for non-command input', () => {
      expect(getCommandSuggestions('hello')).toEqual([]);
      expect(getCommandSuggestions('')).toEqual([]);
    });

    it('returns empty array when command has argument', () => {
      expect(getCommandSuggestions('/cast fireball')).toEqual([]);
      expect(getCommandSuggestions('/use potion')).toEqual([]);
    });

    it('is case insensitive', () => {
      const suggestionsLower = getCommandSuggestions('/ca');
      const suggestionsUpper = getCommandSuggestions('/CA');
      expect(suggestionsLower).toEqual(suggestionsUpper);
    });

    it('returns commands matching prefix', () => {
      const suggestions = getCommandSuggestions('/e');
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].command).toBe('equip');
    });

    it('returns empty array when no command matches', () => {
      expect(getCommandSuggestions('/xyz')).toEqual([]);
      expect(getCommandSuggestions('/jump')).toEqual([]);
    });
  });

  describe('parseActiveCommand', () => {
    it('parses command with space', () => {
      const result = parseActiveCommand('/cast ');
      expect(result.command).toBe('cast');
      expect(result.argumentPartial).toBe('');
    });

    it('parses command with partial argument', () => {
      const result = parseActiveCommand('/cast fire');
      expect(result.command).toBe('cast');
      expect(result.argumentPartial).toBe('fire');
    });

    it('returns null command for non-command input', () => {
      const result = parseActiveCommand('hello');
      expect(result.command).toBeNull();
    });

    it('returns null command for invalid command', () => {
      const result = parseActiveCommand('/invalid ');
      expect(result.command).toBeNull();
    });
  });

  describe('getArgumentSuggestions', () => {
    const mockSpells = [
      { name: 'Fireball', level: 3, description: 'A ball of fire', meta: {} },
      { name: 'Ice Storm', level: 4, description: 'Freezing storm', meta: {} },
      { name: 'Fire Shield', level: 4, meta: {} },
    ];

    const mockInventory = [
      { name: 'Health Potion', qty: 3, description: 'Restores HP', meta: {} },
      { name: 'Sword', qty: 1, meta: {} },
      { name: 'Shield', qty: 1, description: 'Blocks attacks', meta: {} },
    ];

    it('returns spell suggestions for /cast command', () => {
      const suggestions = getArgumentSuggestions('cast', '', mockSpells, mockInventory);
      expect(suggestions).toHaveLength(3);
      expect(suggestions.every(s => s.type === 'spell')).toBe(true);
    });

    it('filters spells by partial name', () => {
      const suggestions = getArgumentSuggestions('cast', 'fire', mockSpells, mockInventory);
      expect(suggestions).toHaveLength(2);
      expect(suggestions.map(s => s.name)).toContain('Fireball');
      expect(suggestions.map(s => s.name)).toContain('Fire Shield');
    });

    it('returns item suggestions for /use command', () => {
      const suggestions = getArgumentSuggestions('use', '', mockSpells, mockInventory);
      expect(suggestions).toHaveLength(3);
      expect(suggestions.every(s => s.type === 'item')).toBe(true);
    });

    it('returns item suggestions for /equip command', () => {
      const suggestions = getArgumentSuggestions('equip', '', mockSpells, mockInventory);
      expect(suggestions).toHaveLength(3);
      expect(suggestions.every(s => s.type === 'item')).toBe(true);
    });

    it('filters items by partial name', () => {
      const suggestions = getArgumentSuggestions('use', 'shield', mockSpells, mockInventory);
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].name).toBe('Shield');
    });

    it('returns empty array for /attack command', () => {
      const suggestions = getArgumentSuggestions('attack', '', mockSpells, mockInventory);
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('getAllSuggestions', () => {
    const mockSpells = [
      { name: 'Fireball', level: 3, meta: {} },
    ];

    const mockInventory = [
      { name: 'Health Potion', qty: 1, meta: {} },
    ];

    it('returns command suggestions for partial command', () => {
      const result = getAllSuggestions('/ca', mockSpells, mockInventory);
      expect(result.type).toBe('command');
      expect(result.commandSuggestions).toHaveLength(1);
      expect(result.argumentSuggestions).toHaveLength(0);
    });

    it('returns argument suggestions after command with space', () => {
      const result = getAllSuggestions('/cast ', mockSpells, mockInventory);
      expect(result.type).toBe('argument');
      expect(result.commandSuggestions).toHaveLength(0);
      expect(result.argumentSuggestions).toHaveLength(1);
      expect(result.activeCommand).toBe('cast');
    });

    it('returns filtered argument suggestions', () => {
      const result = getAllSuggestions('/cast fire', mockSpells, mockInventory);
      expect(result.type).toBe('argument');
      expect(result.argumentSuggestions).toHaveLength(1);
      expect(result.argumentSuggestions[0].name).toBe('Fireball');
    });

    it('returns empty suggestions for non-command input', () => {
      const result = getAllSuggestions('hello', mockSpells, mockInventory);
      expect(result.commandSuggestions).toHaveLength(0);
      expect(result.argumentSuggestions).toHaveLength(0);
    });
  });
});
