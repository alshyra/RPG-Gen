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
import { createTestApp, closeTestApp, type TestAppContext } from '../helpers/test-app.js';

const TEST_USER_ID = '507f1f77bcf86cd799439011';

async function setup() {
	const ctx = await createTestApp([(await import('../../src/modules/chat.module.js')).ChatModule]);
	const convService = ctx.module.get((await import('../../src/domain/chat/conversation.service.js')).ConversationService);
	return { ctx, convService } as { ctx: TestAppContext; convService: InstanceType<typeof (await import('../../src/domain/chat/conversation.service.js')).ConversationService> };
}

// Test: append creates new history when none exists
test('append creates new history and stores message', async t => {
	const { ctx, convService } = await setup();
	try {
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
	} finally {
		await closeTestApp(ctx);
	}
});

// Test: append appends to existing history
test('append appends message to existing history', async t => {
	const { ctx, convService } = await setup();
	try {
		const cid = 'char-append-2';
		await convService.append(TEST_USER_ID, cid, {
			role: 'user',
			narrative: 'First message',
			instructions: [],
		});
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
	} finally {
		await closeTestApp(ctx);
	}
});

// Test: append without narrative throws
test('append without narrative throws', async t => {
	const { ctx, convService } = await setup();
	try {
		await t.throwsAsync(
			() =>
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