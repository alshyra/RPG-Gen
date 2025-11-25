import { describe, it, expect } from 'vitest';
import {
  isCommand,
  parseCommand,
  generateUseCommand,
  generateCastCommand,
  generateEquipCommand,
  generateAttackCommand,
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
});
