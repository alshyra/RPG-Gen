import { ImageService } from "../domain/services/ImageService.js";

// Create a minimal valid PNG image as base64
// This is a 1x1 pixel PNG
const VALID_PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

const VALID_PNG_DATA_URI = `data:image/png;base64,${VALID_PNG_BASE64}`;

// ===========================
// ImageService.compressImage Tests
// ===========================

describe('ImageService', () => {
  describe('compressImage', () => {
    test("compresses valid image", async () => {
      const service = new ImageService();

      const result = await service.compressImage(VALID_PNG_DATA_URI);

      expect(result.startsWith("data:image/jpeg;base64,")).toBe(true);
    });

    test("compresses buffer input", async () => {
      const service = new ImageService();
      const buffer = Buffer.from(VALID_PNG_BASE64, "base64");

      const result = await service.compressImage(buffer);

      expect(result.startsWith("data:image/jpeg;base64,")).toBe(true);
    });

    test("throws on invalid image", async () => {
      const service = new ImageService();

      await expect(
        service.compressImage("invalid-image-data")
      ).rejects.toThrow(/Failed to compress image/);
    });
  });

  // ===========================
  // ImageService.validateImage Tests
  // ===========================

  describe('validateImage', () => {
    test("returns true for valid image", async () => {
      const service = new ImageService();

      const isValid = await service.validateImage(VALID_PNG_DATA_URI);

      expect(isValid).toBe(true);
    });

    test("returns false for invalid data", async () => {
      const service = new ImageService();

      const isValid = await service.validateImage("not-an-image");

      expect(isValid).toBe(false);
    });

    test("returns false for empty string", async () => {
      const service = new ImageService();

      const isValid = await service.validateImage("");

      expect(isValid).toBe(false);
    });
  });
});
