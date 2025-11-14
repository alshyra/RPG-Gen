import test from 'ava';
import { ImageService } from '../src/image/image.service';

// Mock logger
const mockLogger = {
  log: () => {},
  debug: () => {},
  error: () => {},
  warn: () => {},
  verbose: () => {},
};

test('ImageService should compress base64 image', async (t) => {
  const imageService = new ImageService();
  // Override logger to avoid console output
  (imageService as any).logger = mockLogger;

  // Create a small test image (1x1 red pixel PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  const testImageDataUri = `data:image/png;base64,${testImageBase64}`;

  const compressed = await imageService.compressImage(testImageDataUri);

  t.truthy(compressed);
  t.true(compressed.startsWith('data:image/jpeg;base64,'));
  t.true(compressed.length > 0);
});

test('ImageService should compress buffer image', async (t) => {
  const imageService = new ImageService();
  (imageService as any).logger = mockLogger;

  // Create a small test image buffer (1x1 red pixel PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  const testImageBuffer = Buffer.from(testImageBase64, 'base64');

  const compressed = await imageService.compressImage(testImageBuffer);

  t.truthy(compressed);
  t.true(compressed.startsWith('data:image/jpeg;base64,'));
});

test('ImageService should validate valid image', async (t) => {
  const imageService = new ImageService();
  (imageService as any).logger = mockLogger;

  // Create a small test image (1x1 red pixel PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  const testImageDataUri = `data:image/png;base64,${testImageBase64}`;

  const isValid = await imageService.validateImage(testImageDataUri);

  t.true(isValid);
});

test('ImageService should reject invalid image', async (t) => {
  const imageService = new ImageService();
  (imageService as any).logger = mockLogger;

  const invalidImage = 'data:image/png;base64,invalid-base64-data';

  const isValid = await imageService.validateImage(invalidImage);

  t.false(isValid);
});

test('ImageService should handle compression errors gracefully', async (t) => {
  const imageService = new ImageService();
  (imageService as any).logger = mockLogger;

  const invalidImage = 'invalid-data';

  await t.throwsAsync(
    async () => await imageService.compressImage(invalidImage),
    { message: /Failed to compress image/ }
  );
});
