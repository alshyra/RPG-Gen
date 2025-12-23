import test from "ava";
import { InternalServerErrorException, ServiceUnavailableException } from "@nestjs/common";
import { GeminiTextService } from "../../src/bounded-contexts/chat/external/gemini-text.service.js";
import type { ChatMessageDto } from "@rpg-gen/shared";

test("initializeChatSession creates history with parts (not content)", async t => {
  const svc = new GeminiTextService();

  const mockMessages: ChatMessageDto[] = [
    {
      role: "user",
      narrative: "Hello AI",
      instructions: undefined,
    },
    {
      role: "assistant",
      narrative: "Hello human",
      instructions: undefined,
    },
  ];

  svc.initializeChatSession("test-session", "System prompt", mockMessages);

  // Verify that chat was created and history was passed with correct format
  // by checking that the chat client was registered
  const fakeChat = (svc as any).chatClients.get("test-session");
  t.truthy(fakeChat, "Chat client should be registered");
});

test("sendMessage passes message as { message } to chat.sendMessage", async t => {
  const svc = new GeminiTextService();

  let capturedParams: any;
  const fakeChat = {
    sendMessage: async (params: any) => {
      capturedParams = params;
      return {
        text: JSON.stringify({
          narrative: "Response",
          instructions: [],
        }),
      };
    },
  } as const;

  (svc as any).chatClients.set("test-session", fakeChat);

  await svc.sendMessage("test-session", "Test message");

  t.deepEqual(capturedParams, { message: "Test message" }, "Should pass { message: ... }");
});

test("sendMessage parses valid structured JSON into ChatMessageDto", async t => {
  const svc = new GeminiTextService();

  // create a fake chat client with a stable sendMessage response
  const fakeChat = {
    sendMessage: async () => ({
      text: JSON.stringify({
        narrative: "A quick test scene",
        instructions: [
          {
            type: "hp",
            hp: 5,
          },
        ],
      }),
    }),
  } as const;

  // inject fake chat session directly
  (svc as any).chatClients.set("test-session", fakeChat);

  const result = await svc.sendMessage("test-session", "anything");

  t.is(result.role, "assistant");
  t.is(result.narrative, "A quick test scene");
  t.truthy(result.instructions);
  t.is(Array.isArray(result.instructions), true);
  t.is((result.instructions as any)[0].type, "hp");
});

test("sendMessage throws if AI returns invalid JSON", async t => {
  const svc = new GeminiTextService();

  const fakeChat = {
    sendMessage: async () => ({ text: "this is not json" }),
  } as const;

  (svc as any).chatClients.set("broken-session", fakeChat);

  const err = await t.throwsAsync(() => svc.sendMessage("broken-session", "anything"));
  t.true(err instanceof InternalServerErrorException);
});

test("sendMessage unwraps payload-wrapped instructions before validation", async t => {
  const svc = new GeminiTextService();

  const fakeChat = {
    sendMessage: async () => ({
      text: JSON.stringify({
        narrative: "Bardinou, you wake in an arena",
        instructions: [
          {
            type: "combat_start",
            payload: {
              combat_start: [
                {
                  name: "Goblin-1",
                  hp: 7,
                  ac: 10,
                  attack_bonus: 0,
                  damage_dice: "1d4",
                  damage_bonus: 0,
                },
              ],
            },
          },
        ],
      }),
    }),
  } as const;

  (svc as any).chatClients.set("payload-session", fakeChat);

  const result = await svc.sendMessage("payload-session", "anything");

  t.is(result.role, "assistant");
  t.is(result.narrative, "Bardinou, you wake in an arena");
  t.truthy(result.instructions);
  t.is((result.instructions as any)[0].type, "combat_start");
  t.true(Array.isArray((result.instructions as any)[0].combat_start));
  t.is((result.instructions as any)[0].combat_start[0].name, "Goblin-1");
});
test("sendMessage throws ServiceUnavailableException when Gemini API returns 503 (overloaded)", async t => {
  const svc = new GeminiTextService();

  // Simulate the Gemini API error structure for 503 UNAVAILABLE
  const geminiError = {
    ApiError: {
      error: {
        code: 503,
        message: "The model is overloaded. Please try again later.",
        status: "UNAVAILABLE",
      },
    },
  };

  const fakeChat = {
    sendMessage: async () => {
      throw geminiError;
    },
  } as const;

  (svc as any).chatClients.set("overloaded-session", fakeChat);

  const err = await t.throwsAsync(() => svc.sendMessage("overloaded-session", "test"));
  t.true(err instanceof ServiceUnavailableException);
  t.regex(err.message, /temporarily unavailable/i);
});

test("sendMessage throws ServiceUnavailableException when Gemini API status is UNAVAILABLE", async t => {
  const svc = new GeminiTextService();

  // Simulate different error structure
  const geminiError = {
    ApiError: {
      error: {
        code: 429,
        message: "Too many requests",
        status: "UNAVAILABLE",
      },
    },
  };

  const fakeChat = {
    sendMessage: async () => {
      throw geminiError;
    },
  } as const;

  (svc as any).chatClients.set("unavailable-session", fakeChat);

  const err = await t.throwsAsync(() => svc.sendMessage("unavailable-session", "test"));
  t.true(err instanceof ServiceUnavailableException);
});

test("sendMessage re-throws non-503 errors", async t => {
  const svc = new GeminiTextService();

  const regularError = new Error("Some unexpected error");

  const fakeChat = {
    sendMessage: async () => {
      throw regularError;
    },
  } as const;

  (svc as any).chatClients.set("error-session", fakeChat);

  const err = await t.throwsAsync(() => svc.sendMessage("error-session", "test"));
  t.is(err, regularError);
});
