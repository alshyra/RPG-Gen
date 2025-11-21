import test from 'ava';
import { ImageController } from '../src/image/image.controller.js';
import type { Request } from 'express';

class FakeGeminiImageService {
  async generateImage(_prompt: string) {
    return 'data:image/png;base64,TEST';
  }
}

class FakeImageService {
  async compressImage(_image: string) {
    return 'data:image/jpeg;base64,COMPRESSED';
  }
}

class FakeCharacterService {
  findByCharacterId(_userId: string, characterId: string) {
    return {
      characterId,
      name: 'Test',
      gender: 'male',
      race: { name: 'Human' },
      classes: [{ name: 'Rogue', level: 1 }],
      physicalDescription: 'Short guy with a dagger',
    } as any;
  }

  async update() {
    return true as any;
  }
}

const controller = new ImageController(new FakeGeminiImageService() as any, new FakeImageService() as any, new FakeCharacterService() as any);

const fakeReq = { user: { _id: 'user1' } } as Request;

test('generateAvatar accepts object payload with characterId', async (t) => {
  const res = await controller.generateAvatar(fakeReq, { characterId: 'character-1' });
  t.truthy(res);
  t.truthy(res.imageUrl);
  t.true(res.imageUrl.startsWith('data:image/jpeg;base64,'));
});

test('generateAvatar accepts array payload with characterId', async (t) => {
  const res = await controller.generateAvatar(fakeReq, [{ characterId: 'character-2' }]);
  t.truthy(res);
  t.truthy(res.imageUrl);
});

test('generateAvatar accepts raw string payload (characterId)', async (t) => {
  const res = await controller.generateAvatar(fakeReq, 'character-3');
  t.truthy(res);
  t.truthy(res.imageUrl);
});

test('generateAvatar throws when missing characterId', async (t) => {
  await t.throwsAsync(async () => await controller.generateAvatar(fakeReq, undefined as any));
});
