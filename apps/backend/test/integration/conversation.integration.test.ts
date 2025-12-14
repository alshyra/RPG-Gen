/**
 * Integration tests for ConversationService.
 *
 * These tests bootstrap a real NestJS application with in-memory MongoDB
 * and test the ConversationService domain through the actual services (not mocked helpers).
 *
 * Tests verify:
 * - Message history retrieval and formatting for the model
 * - Appending new messages to history (creating new history when none exists)
 * - Validation errors when appending messages with missing narrative
 */
import test from 'ava';
import { Types } from 'mongoose';
import { ConversationService } from '../../src/domain/chat/conversation.service.js';
import { ChatModule } from '../../src/modules/chat.module.js';
import { closeTestApp, createTestApp } from '../helpers/test-app.js';
import history from '../mocks/history.js';

const TEST_USER_ID = '507f1f77bcf86cd799439011';

/**
 * Transform extended JSON history mock (with $oid/$date placeholders)
 * into a proper document with ObjectId and Date instances.
 */
function transformHistoryMock(mockData: any) {
  return {
    _id: new Types.ObjectId(mockData._id.$oid),
    userId: new Types.ObjectId(mockData.userId.$oid),
    characterId: mockData.characterId,
    messages: mockData.messages,
    lastUpdated: new Date(mockData.lastUpdated.$date),
    createdAt: new Date(mockData.createdAt.$date),
    updatedAt: new Date(mockData.updatedAt.$date),
    __v: mockData.__v,
  };
}

async function setup() {
  const ctx = await createTestApp([ChatModule]);
  const convService = ctx.module.get(ConversationService);
  return { ctx, convService };
}

// Test: append creates new history when none exists
test('Conversation Integration append creates new history and stores message', async t => {
  const { ctx, convService } = await setup();
  await convService.append(TEST_USER_ID, 'char-append-1', {
    role: 'user',
    narrative: 'Hello world',
    instructions: [],
  });

  const hist = await convService.getHistoryMessages(TEST_USER_ID, 'char-append-1');
  t.truthy(hist);
  t.is(hist?.length, 1);
  t.is(hist?.[0].role, 'user');
  t.is(hist?.[0].narrative, 'Hello world');
  await closeTestApp(ctx);
});

// Test: append appends to existing history
test('Conversation Integration append appends message to existing history', async t => {
  const { ctx, convService } = await setup();
  const cid = history.characterId;

  // Seed the test DB with pre-existing history
  const transformedHistory = transformHistoryMock(history);
  // Update userId to TEST_USER_ID for this test
  transformedHistory.userId = new Types.ObjectId(TEST_USER_ID);
  await ctx.mongoConnection.collection('chathistories').insertOne(transformedHistory);

  // Verify history was seeded (should have 1 message)
  const initialHist = await convService.getHistoryMessages(TEST_USER_ID, cid);
  t.truthy(initialHist);
  t.is(initialHist?.length, 1);

  // Append a new message
  await convService.append(TEST_USER_ID, cid, {
    role: 'assistant',
    narrative: 'Reply message',
    instructions: [],
  });

  const hist = await convService.getHistoryMessages(TEST_USER_ID, cid);
  t.truthy(hist);
  t.is(hist?.length, 2);
  t.is(hist?.[1].role, 'assistant');
  t.is(hist?.[1].narrative, 'Reply message');
  await closeTestApp(ctx);
});

// Test: append without narrative throws
test('Conversation Integration append without narrative throws', async t => {
  const { ctx, convService } = await setup();
  try {
    await t.throwsAsync(() =>
      convService.append(TEST_USER_ID, 'char-append-3', {
        role: 'user',
        // narrative missing / empty should trigger validation
        narrative: '',
        instructions: [],
      }),
    );
  } finally {
    await closeTestApp(ctx);
  }
});
