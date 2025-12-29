import test from "ava";
import { GeminiImageService } from "../infrastructure/external/GeminiImageService.js";
import { loadConfig } from "../../../config.js";

// ===========================
// GeminiImageService Mock Mode Tests
// ===========================

test.before(() => {
  // Enable mock mode for tests
  process.env.MOCK_GEMINI = "true";
  // Load configuration
  loadConfig();
});

test.after(() => {
  delete process.env.MOCK_GEMINI;
});

test("GeminiImageService.generateImage - returns mock image in mock mode", async t => {
  const service = new GeminiImageService();

  const result = await service.generateImage("Generate a fantasy portrait");

  // Should return a mock SVG data URI
  t.true(result.startsWith("data:image/svg+xml;base64,"));
});

test("GeminiImageService.generateImage - mock image is valid base64", async t => {
  const service = new GeminiImageService();

  const result = await service.generateImage("Test prompt");

  // Extract and validate base64
  const base64Part = result.replace("data:image/svg+xml;base64,", "");
  t.notThrows(() => Buffer.from(base64Part, "base64"));
});

test("GeminiImageService.generateImage - mock image contains expected SVG content", async t => {
  const service = new GeminiImageService();

  const result = await service.generateImage("Any prompt");

  // Decode and check content
  const base64Part = result.replace("data:image/svg+xml;base64,", "");
  const decoded = Buffer.from(base64Part, "base64").toString("utf-8");

  t.true(decoded.includes("<svg"));
  t.true(decoded.includes("MOCK"));
});
