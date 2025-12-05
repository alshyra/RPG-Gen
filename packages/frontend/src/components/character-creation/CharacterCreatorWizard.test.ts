import { mount } from '@vue/test-utils';
import {
  describe, it, expect, vi,
} from 'vitest';
import { ref } from 'vue';

// Route/mock helpers come from test/setup.ts vi.mock('vue-router')
import { useRoute } from 'vue-router';

// Mock character store and api
const currentCharacter = ref({
  characterId: 'c1',
  classes: [
    {
      name: 'Fighter',
      level: 1,
    },
  ],
  scores: { Con: 12 },
  name: 'Hero',
  inventory: [],
});

vi.mock('@/stores/characterStore', () => ({
  useCharacterStore: () => ({
    currentCharacter,
    updateCharacter: vi.fn(async () => {}),
  }),
}));

vi.mock('@/apis/characterApi', async () => ({
  characterApi: {
    generateAvatar: vi.fn(async (_: string) => 'data:image/png;base64,avatar'),
    getCharacterById: vi.fn(async (_: string) => ({
      ...currentCharacter.value,
      portrait: 'data:image/png;base64,avatar',
    })),
  },
}));

vi.mock('@/services/dndRulesService', () => ({ DnDRulesService: { calculateHpForLevel1: () => 10 } }));

vi.mock('@/apis/conversationApi', async () => ({ conversationService: { startGame: vi.fn(async () => []) } }));

describe('CharacterCreatorWizard finish flow', () => {
  it('generates avatar, refreshes store and navigates to game', async () => {
    // ensure we are on last step
    const route = useRoute();
    route.params.step = '7';
    route.params.characterId = 'c1';

    const wrapper = mount((await import('./CharacterCreatorWizard.vue')).default, {
      global: {
        stubs: [
          'StepBasicInfo',
          'StepRaceClass',
          'StepAbilityScores',
          'StepSkills',
          'StepSpells',
          'StepInventory',
          'StepAvatar',
          'UiLoader',
          'UiButton',
        ],
      },
    });

    // call the finishCreation flow directly
    await (wrapper.vm as any).finishCreation();

    // after finishCreation the currentCharacter should include portrait
    expect((currentCharacter.value as any).portrait)
      .toBeTruthy();
  });

  it('shows full page loader while avatar and first prompt are prepared', async () => {
    const route = useRoute() as any;
    route.params.step = '7';
    route.params.characterId = 'c1';

    // Override mocks to return pending promises so we can assert the loader is visible
    const api = await import('@/apis/characterApi');
    let genResolve: (v?: any) => void = () => {};
    const genPromise = new Promise<string>((resolve) => {
      genResolve = resolve;
    });
    (api.characterApi.generateAvatar as any).mockImplementation(() => genPromise);

    const conv = await import('@/apis/conversationApi');
    let startResolve: (v?: any) => void = () => {};
    const startPromise = new Promise<any>((resolve) => {
      startResolve = resolve;
    });
    (conv.conversationService.startGame as any).mockImplementation(() => startPromise);

    const wrapper = mount((await import('./CharacterCreatorWizard.vue')).default, {
      global: {
        stubs: [
          'StepBasicInfo',
          'StepRaceClass',
          'StepAbilityScores',
          'StepSkills',
          'StepSpells',
          'StepInventory',
          'StepAvatar',
          'UiLoader',
          'UiButton',
          'FullPageLoader',
        ],
      },
    });

    // Kick off finishCreation but don't await final completion
    const promise = (wrapper.vm as any).finishCreation();
    // Wait for nextTick so DOM reflects isLoading change
    await wrapper.vm.$nextTick();

    // While pending, isLoading flag should be true and the full page loader should be present
    expect((wrapper.vm as any).isLoading)
      .toBe(true);
    expect(wrapper.find('full-page-loader-stub')
      .exists())
      .toBe(true);

    // Resolve pending operations so finishCreation can complete
    genResolve?.('data:image/png;base64,avatar');
    startResolve?.([]);
    await promise;

    // isLoading should be false after completion and the loader removed
    expect((wrapper.vm as any).isLoading)
      .toBe(false);
    expect(wrapper.find('full-page-loader-stub')
      .exists())
      .toBe(false);
  });
});
