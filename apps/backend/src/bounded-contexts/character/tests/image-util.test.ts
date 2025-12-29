import { compressImage, validateImage } from "../domain/image.util.js";

// ===========================
// Image Compression Tests
// ===========================

// Create a minimal valid PNG image as base64
// This is a 1x1 red pixel PNG
const VALID_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

const VALID_PNG_DATA_URI = `data:image/png;base64,${VALID_PNG_BASE64}`;

describe('compressImage', () => {
  test("compresses base64 string input", async () => {
    const result = await compressImage(VALID_PNG_DATA_URI);

    // Result should be a JPEG data URI
    expect(result.startsWith("data:image/jpeg;base64,")).toBe(true);
    // Should be valid base64
    const base64Part = result.replace("data:image/jpeg;base64,", "");
    expect(() => Buffer.from(base64Part, "base64")).not.toThrow();
  });

  test("compresses buffer input", async () => {
    const buffer = Buffer.from(VALID_PNG_BASE64, "base64");

    const result = await compressImage(buffer);

    expect(result.startsWith("data:image/jpeg;base64,")).toBe(true);
  });

  test("strips data URI prefix correctly", async () => {
    // With data URI prefix
    const withPrefix = await compressImage(VALID_PNG_DATA_URI);
    // Without data URI prefix
    const withoutPrefix = await compressImage(VALID_PNG_BASE64);

    // Both should produce valid output
    expect(withPrefix.startsWith("data:image/jpeg;base64,")).toBe(true);
    expect(withoutPrefix.startsWith("data:image/jpeg;base64,")).toBe(true);
  });

  test("throws on invalid image data", async () => {
    const invalidData = "not-a-valid-image";

    await expect(compressImage(invalidData)).rejects.toThrow();
  });
});

// ===========================
// Image Validation Tests
// ===========================

describe('validateImage', () => {
  test("returns true for valid PNG", async () => {
    const isValid = await validateImage(VALID_PNG_DATA_URI);
    expect(isValid).toBe(true);
  });

  test("returns true for valid buffer", async () => {
    const buffer = Buffer.from(VALID_PNG_BASE64, "base64");
    const isValid = await validateImage(buffer);
    expect(isValid).toBe(true);
  });

  test("returns false for invalid data", async () => {
    const isValid = await validateImage("not-valid-image-data");
    expect(isValid).toBe(false);
  });

  test("returns false for empty string", async () => {
    const isValid = await validateImage("");
    expect(isValid).toBe(false);
  });

  test("returns false for empty buffer", async () => {
    const isValid = await validateImage(Buffer.alloc(0));
    expect(isValid).toBe(false);
  });
});
