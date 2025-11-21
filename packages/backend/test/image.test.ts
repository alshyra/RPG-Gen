import test from 'ava';
import { compressImage, validateImage } from '../src/image/image.util.js';

test('compressImage should compress base64 image', async (t) => {
  // Create a small test image (1x1 red pixel PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  const testImageDataUri = `data:image/png;base64,${testImageBase64}`;

  const compressed = await compressImage(testImageDataUri);

  t.truthy(compressed);
  t.true(compressed.startsWith('data:image/jpeg;base64,'));
  t.true(compressed.length > 0);
});

test('compressImage should compress buffer image', async (t) => {
  // Create a small test image buffer (1x1 red pixel PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  const testImageBuffer = Buffer.from(testImageBase64, 'base64');

  const compressed = await compressImage(testImageBuffer);

  t.truthy(compressed);
  t.true(compressed.startsWith('data:image/jpeg;base64,'));
});

test('validateImage should validate valid image', async (t) => {
  // Create a small test image (1x1 red pixel PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
  const testImageDataUri = `data:image/png;base64,${testImageBase64}`;

  const isValid = await validateImage(testImageDataUri);

  t.true(isValid);
});

test('validateImage should reject invalid image', async (t) => {
  const invalidImage = 'data:image/png;base64,invalid-base64-data';

  const isValid = await validateImage(invalidImage);

  t.false(isValid);
});

test('compressImage should handle compression errors gracefully', async (t) => {
  const invalidImage = 'invalid-data';

  await t.throwsAsync(
    async () => await compressImage(invalidImage),
  );
});
