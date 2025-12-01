import test from 'ava';
import { ChatController } from '../src/chat/chat.controller.js';

test('chat.chat initializes session when missing and replies', async (t) => {
  let initialized = false;
  const gemini: any = {
    initializeChatSession: (_sessionId: string, _system: string, _history: any[]) => { initialized = true; },
    sendMessage: async (_sessionId: string, _msg: string) => {
      if (!initialized) throw new Error('Chat session missing. Call getOrCreateChat first.');
      return { text: 'assistant reply', usage: {}, modelVersion: 'm1' };
    },
  };

  const appended: any[] = [];
  const conv: any = {
    append: async (_u: string, _c: string, msg: any) => { appended.push(msg); },
    getHistory: async () => [],
    buildCharacterSummary: () => 'Test character summary',
  };

  const characterService: any = {
    findByCharacterId: async () => ({ name: 'Hero', classes: [{ name: 'Fighter', level: 1 }], scores: { Con: 12 } }),
  };

  const gamesInstructionProcessor: any = {};

  const controller = new ChatController(gemini, conv, characterService, gamesInstructionProcessor);

  const req: any = { user: { _id: { toString: () => 'u1' } } };

  const result = await controller.chat(req, 'char1', { narrative: 'hello' } as any);
  t.truthy(result.role.includes('assistant'));
  t.is(appended.length, 2, 'should append user and assistant messages');
});

test('ensureChatSession uses existing history when initializing', async (t) => {
  let capturedHistory: any = null;
  const gemini: any = {
    initializeChatSession: (_sessionId: string, _system: string, history: any[]) => { capturedHistory = history; },
    sendMessage: async (_sessionId: string, _msg: string) => ({ text: 'ok', usage: {}, modelVersion: 'v' }),
  };

  const conv: any = {
    append: async () => {},
    getHistory: async () => [
      { role: 'user', text: 'u1', timestamp: Date.now() },
      { role: 'assistant', text: 'a1', timestamp: Date.now() },
    ],
    buildCharacterSummary: () => 'Test character summary',
  };

  const characterService: any = { findByCharacterId: async () => ({}) };
  const gamesInstructionProcessor: any = {};
  const controller = new ChatController(gemini, conv, characterService, gamesInstructionProcessor);

  // call public method to verify initialization behavior
  const req: any = { user: { _id: { toString: () => 'u1' } } };
  await (controller as any).getHistory(req, 'char2');
  t.truthy(Array.isArray(capturedHistory));
  t.is(capturedHistory.length, 2);
  t.is(capturedHistory[0].role, 'user');
  // The mock receives the raw history from conversationService - transformation to 'model' happens inside real GeminiTextService
  t.is(capturedHistory[1].role, 'assistant');
});
