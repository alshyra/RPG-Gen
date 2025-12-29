import test from "ava";
import { compressImage, validateImage } from "../domain/image.util.js";

// ===========================
// Image Compression Tests
// ===========================

// Create a minimal valid PNG image as base64
// This is a 1x1 red pixel PNG
const VALID_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

const VALID_PNG_DATA_URI = `data:image/png;base64,${VALID_PNG_BASE64}`;

test("compressImage - compresses base64 string input", async t => {
  const result = await compressImage(VALID_PNG_DATA_URI);

  // Result should be a JPEG data URI
  t.true(result.startsWith("data:image/jpeg;base64,"));
  // Should be valid base64
  const base64Part = result.replace("data:image/jpeg;base64,", "");
  t.notThrows(() => Buffer.from(base64Part, "base64"));
});

test("compressImage - compresses buffer input", async t => {
  const buffer = Buffer.from(VALID_PNG_BASE64, "base64");

  const result = await compressImage(buffer);

  t.true(result.startsWith("data:image/jpeg;base64,"));
});

test("compressImage - strips data URI prefix correctly", async t => {
  // With data URI prefix
  const withPrefix = await compressImage(VALID_PNG_DATA_URI);
  // Without data URI prefix
  const withoutPrefix = await compressImage(VALID_PNG_BASE64);

  // Both should produce valid output
  t.true(withPrefix.startsWith("data:image/jpeg;base64,"));
  t.true(withoutPrefix.startsWith("data:image/jpeg;base64,"));
});

test("compressImage - throws on invalid image data", async t => {
  const invalidData = "not-a-valid-image";

  await t.throwsAsync(async () => {
    await compressImage(invalidData);
  });
});

// ===========================
// Image Validation Tests
// ===========================

test("validateImage - returns true for valid PNG", async t => {
  const isValid = await validateImage(VALID_PNG_DATA_URI);
  t.true(isValid);
});

test("validateImage - returns true for valid buffer", async t => {
  const buffer = Buffer.from(VALID_PNG_BASE64, "base64");
  const isValid = await validateImage(buffer);
  t.true(isValid);
});

test("validateImage - returns false for invalid data", async t => {
  const isValid = await validateImage("not-valid-image-data");
  t.false(isValid);
});

test("validateImage - returns false for empty string", async t => {
  const isValid = await validateImage("");
  t.false(isValid);
});

test("validateImage - returns false for empty buffer", async t => {
  const isValid = await validateImage(Buffer.alloc(0));
  t.false(isValid);
});
