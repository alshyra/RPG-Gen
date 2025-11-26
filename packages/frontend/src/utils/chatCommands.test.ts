import { describe, it, expect } from 'vitest';
import {
  isCommand,
  parseCommand,
  generateUseCommand,
  generateCastCommand,
  generateEquipCommand,
  generateAttackCommand,
  getCommandSuggestions,
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
});
