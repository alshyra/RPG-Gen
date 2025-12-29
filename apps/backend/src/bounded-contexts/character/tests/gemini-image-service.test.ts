import { GeminiImageService } from "../infrastructure/external/GeminiImageService.js";
import { loadConfig } from "../../../config.js";

// ===========================
// GeminiImageService Mock Mode Tests
// ===========================

describe('GeminiImageService', () => {
  beforeAll(() => {
    // Enable mock mode for tests
    process.env.MOCK_GEMINI = "true";
    // Load configuration
    loadConfig();
  });

  afterAll(() => {
    delete process.env.MOCK_GEMINI;
  });

  test("generateImage - returns mock image in mock mode", async () => {
    const service = new GeminiImageService();

    const result = await service.generateImage("Generate a fantasy portrait");

    // Should return a mock SVG data URI
    expect(result.startsWith("data:image/svg+xml;base64,")).toBe(true);
  });

  test("generateImage - mock image is valid base64", async () => {
    const service = new GeminiImageService();

    const result = await service.generateImage("Test prompt");

    // Extract and validate base64
    const base64Part = result.replace("data:image/svg+xml;base64,", "");
    expect(() => Buffer.from(base64Part, "base64")).not.toThrow();
  });

  test("generateImage - mock image contains expected SVG content", async () => {
    const service = new GeminiImageService();

    const result = await service.generateImage("Any prompt");

    // Decode and check content
    const base64Part = result.replace("data:image/svg+xml;base64,", "");
    const decoded = Buffer.from(base64Part, "base64").toString("utf-8");

    expect(decoded.includes("<svg")).toBe(true);
    expect(decoded.includes("MOCK")).toBe(true);
  });
});
