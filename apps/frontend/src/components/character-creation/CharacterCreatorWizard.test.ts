// @ts-nocheck
import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";
import { ref } from "vue";

// Route/mock helpers come from test/setup.ts vi.mock('vue-router')
import { useRoute } from "vue-router";

// Mock character store and api - updated for new system
const currentCharacter = ref({
  characterId: "c1",
  className: "guerrier",
  name: "Hero",
  hp: 12,
  hpMax: 12,
  pa: 6,
  paMax: 6,
  pm: 4,
  pmMax: 4,
  inventory: [],
  aptitudes: [],
});

vi.mock("@/stores/characterStore", () => ({
  useCharacterStore: () => ({
    currentCharacter,
    updateCharacter: vi.fn(async () => {}),
  }),
}));

vi.mock("@/apis/characterApi", async () => ({
  characterApi: {
    generateAvatar: vi.fn(async (_: string) => "data:image/png;base64,avatar"),
    getCharacterById: vi.fn(async (_: string) => ({
      ...currentCharacter,
      portrait: "data:image/png;base64,avatar",
    })),
  },
}));

vi.mock("@/apis/chatApi", async () => ({
  chatApi: { startGame: vi.fn(async () => []) },
}));

describe.skip("CharacterCreatorWizard finish flow", () => {
  it("generates avatar, refreshes store and navigates to game", async () => {
    // ensure we are on last step (step 3 = Avatar in new 3-step flow)
    const route = useRoute();
    route.params.step = "3";
    route.params.characterId = "c1";

    const wrapper = mount((await import("./CharacterCreatorWizard.vue")).default, {
      global: {
        stubs: [
          "StepBasicInfo",
          "StepClassSelection",
          "StepAvatar",
          "UiLoader",
          "UiButton",
        ],
      },
    });

    // call the finishCreation flow directly
    await (wrapper.vm as any).finishCreation();

    // after finishCreation the currentCharacter should include portrait
    expect((currentCharacter as any).portrait).toBeTruthy();
  });

  it("shows full page loader while avatar and first prompt are prepared", async () => {
    const route = useRoute() as any;
    route.params.step = "3";
    route.params.characterId = "c1";

    // Override mocks to return pending promises so we can assert the loader is visible
    const api = await import("@/apis/characterApi");
    let genResolve: (v?: any) => void = () => {};
    const genPromise = new Promise<string>(resolve => {
      genResolve = resolve;
    });
    (api.characterApi.generateAvatar as any).mockImplementation(() => genPromise);

    const conv = await import("@/apis/chatApi");
    let startResolve: (v?: any) => void = () => {};
    const startPromise = new Promise<any>(resolve => {
      startResolve = resolve;
    });
    (conv.chatApi.startGame as any).mockImplementation(() => startPromise);

    const wrapper = mount((await import("./CharacterCreatorWizard.vue")).default, {
      global: {
        stubs: [
          "StepBasicInfo",
          "StepClassSelection",
          "StepAvatar",
          "UiLoader",
          "UiButton",
          "FullPageLoader",
        ],
      },
    });

    // Kick off finishCreation but don't await final completion
    const promise = (wrapper.vm as any).finishCreation();
    // Wait for nextTick so DOM reflects isLoading change
    await wrapper.vm.$nextTick();

    // While pending, isLoading flag should be true and the full page loader should be present
    expect((wrapper.vm as any).isLoading).toBe(true);
    expect(wrapper.find("full-page-loader-stub").exists()).toBe(true);

    // Resolve pending operations so finishCreation can complete
    genResolve?.("data:image/png;base64,avatar");
    startResolve?.([]);
    await promise;

    // isLoading should be false after completion and the loader removed
    expect((wrapper.vm as any).isLoading).toBe(false);
    expect(wrapper.find("full-page-loader-stub").exists()).toBe(false);
  });
});
