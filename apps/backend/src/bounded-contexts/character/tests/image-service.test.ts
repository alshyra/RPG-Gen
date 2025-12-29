import test from "ava";
import { ImageService } from "../domain/services/ImageService.js";

// Create a minimal valid PNG image as base64
// This is a 1x1 pixel PNG
const VALID_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

const VALID_PNG_DATA_URI = `data:image/png;base64,${VALID_PNG_BASE64}`;

// ===========================
// ImageService.compressImage Tests
// ===========================

test("ImageService.compressImage - compresses valid image", async t => {
  const service = new ImageService();

  const result = await service.compressImage(VALID_PNG_DATA_URI);

  t.true(result.startsWith("data:image/jpeg;base64,"));
});

test("ImageService.compressImage - compresses buffer input", async t => {
  const service = new ImageService();
  const buffer = Buffer.from(VALID_PNG_BASE64, "base64");

  const result = await service.compressImage(buffer);

  t.true(result.startsWith("data:image/jpeg;base64,"));
});

test("ImageService.compressImage - throws on invalid image", async t => {
  const service = new ImageService();

  await t.throwsAsync(
    async () => {
      await service.compressImage("invalid-image-data");
    },
    { message: /Failed to compress image/ },
  );
});

// ===========================
// ImageService.validateImage Tests
// ===========================

test("ImageService.validateImage - returns true for valid image", async t => {
  const service = new ImageService();

  const isValid = await service.validateImage(VALID_PNG_DATA_URI);

  t.true(isValid);
});

test("ImageService.validateImage - returns false for invalid data", async t => {
  const service = new ImageService();

  const isValid = await service.validateImage("not-an-image");

  t.false(isValid);
});

test("ImageService.validateImage - returns false for empty string", async t => {
  const service = new ImageService();

  const isValid = await service.validateImage("");

  t.false(isValid);
});
