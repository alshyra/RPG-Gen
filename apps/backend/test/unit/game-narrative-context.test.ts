import test from 'ava';
import { NarrativeContext } from '../../src/bounded-contexts/game-narrative/domain/narrative/entities/NarrativeContext.js';

test('NarrativeContext › should create a context with sessionId', (t) => {
  const context = new NarrativeContext({
    sessionId: 'session-123',
    characterContext: {
      name: 'Aragorn',
      race: 'Human',
      className: 'Ranger',
      level: 10,
      currentHp: 80,
      maxHp: 100,
    },
    systemPrompt: 'You are a game master',
    scenarioPrompt: 'In the forest...',
  });

  t.is(context.getSessionId(), 'session-123');
  t.is(context.getCharacterContext().name, 'Aragorn');
});

test('NarrativeContext › should build character summary from context', (t) => {
  const context = new NarrativeContext({
    sessionId: 'session-123',
    characterContext: {
      name: 'Gandalf',
      race: 'Istari',
      className: 'Wizard',
      level: 20,
      currentHp: 50,
      maxHp: 60,
    },
    systemPrompt: 'You are a game master',
    scenarioPrompt: 'In the tower...',
  });

  const summary = context.buildCharacterSummary();
  t.true(summary.includes('Gandalf'));
  t.true(summary.includes('Wizard'));
  t.true(summary.includes('20'));
  t.true(summary.includes('50'));
});

test('NarrativeContext › should update character context', (t) => {
  const context = new NarrativeContext({
    sessionId: 'session-123',
    characterContext: {
      name: 'Legolas',
      race: 'Elf',
      className: 'Archer',
      level: 15,
      currentHp: 70,
      maxHp: 75,
    },
    systemPrompt: 'You are a game master',
    scenarioPrompt: 'In the woods...',
  });

  const updated = context.updateCharacterContext({
    currentHp: 60,
    level: 16,
  });

  t.is(updated.getCharacterContext().currentHp, 60);
  t.is(updated.getCharacterContext().level, 16);
});

test('NarrativeContext › should build full context with prompts', (t) => {
  const context = new NarrativeContext({
    sessionId: 'session-123',
    characterContext: {
      name: 'Gimli',
      race: 'Dwarf',
      className: 'Fighter',
      level: 12,
      currentHp: 100,
      maxHp: 100,
    },
    systemPrompt: 'You are a game master...',
    scenarioPrompt: 'The party enters a dark cave...',
  });

  const fullContext = context.getFullContext();
  t.true(fullContext.includes('You are a game master'));
  t.true(fullContext.includes('The party enters a dark cave'));
  t.true(fullContext.includes('Gimli'));
});

test('NarrativeContext › should handle context without optional fields', (t) => {
  const context = new NarrativeContext({
    sessionId: 'session-123',
    characterContext: {
      name: 'Character',
      race: 'Unknown',
      className: 'Warrior',
      level: 1,
    },
    systemPrompt: 'System prompt',
    scenarioPrompt: 'Scenario prompt',
  });

  const summary = context.buildCharacterSummary();
  t.true(summary.includes('Character'));
  t.true(summary.includes('Warrior'));
});
