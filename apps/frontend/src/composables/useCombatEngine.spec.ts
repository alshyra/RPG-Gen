import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, computed } from "vue";
import { useCombatEngine } from "@/composables/useCombatEngine";
import type { CombatArenaApi } from "@/composables/useCombatEngine";
import type { CombatantDto } from "@rpg-gen/shared";

// Mock dependencies
vi.mock("@/composables/useCombat", () => ({
  useCombat: () => ({
    executeAttack: vi.fn().mockResolvedValue(undefined),
    checkCombatVictory: vi.fn(),
    isCombatEndModalOpen: ref(false),
    combatEndNarrative: ref(""),
    closeCombatEndModal: vi.fn(),
  }),
}));

vi.mock("@/composables/useCurrentCharacter", () => ({
  useCurrentCharacter: () =>
    computed(() => ({
      characterId: "char-1",
      name: "Hero",
      hp: 10,
      hpMax: 10,
    })),
}));

vi.mock("@/composables/useCharacterId", () => ({
  useCharacterId: () => ref("char-1"),
}));

vi.mock("@rpg-gen/api-client", () => ({
  useCombat: () => ({
    isInCombat: computed(() => true),
    status: {
      data: ref({
        inCombat: true,
        enemies: [{ id: "enemy-1", name: "Goblin", hp: 5 }],
        player: { id: "player-1", name: "Hero", hp: 10 },
        turnOrder: [],
        currentTurnIndex: 0,
        roundNumber: 1,
        actionRemaining: 1,
        actionMax: 1,
      }),
      refetch: vi.fn().mockResolvedValue(undefined),
    },
    canAct: computed(() => true),
    endTurn: { mutateAsync: vi.fn().mockResolvedValue({}) },
    attack: { mutateAsync: vi.fn().mockResolvedValue({}) },
    startCombat: { mutateAsync: vi.fn().mockResolvedValue({}) },
  }),
  useCharacter: () => ({
    character: { data: ref({ characterId: "char-1", name: "Hero" }) },
  }),
}));

const mockCurrentAttackView = ref<{ totalDamage: number } | null>(null);

vi.mock("@/stores/combatStore", () => ({
  useCombatStore: () => ({
    enemies: ref([
      {
        id: "enemy-1",
        name: "Goblin",
        hp: 5,
        hpMax: 7,
        ac: 12,
        isPlayer: false,
      },
    ]),
    player: ref({
      id: "player-1",
      name: "Hero",
      hp: 10,
      hpMax: 10,
      ac: 14,
      isPlayer: true,
    }),
    inCombat: ref(true),
    isEndingTurn: ref(false),
    currentAttackView: mockCurrentAttackView,
    updateFromTurnResult: vi.fn(),
  }),
}));

vi.mock("@/stores/characterStore", () => ({
  useCharacterStore: () => ({
    currentCharacter: ref({
      characterId: "char-1",
      name: "Hero",
    }),
  }),
}));

vi.mock("@/stores/gameStore", () => ({
  useGameStore: () => ({
    appendMessage: vi.fn(),
  }),
}));

vi.mock("@/apis/combatApi", () => ({
  combatApi: {
    endActivation: vi.fn(),
  },
}));

describe("useCombatEngine - Attack Visual Updates", () => {
  let mockArenaApi: CombatArenaApi;

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset attack view
    mockCurrentAttackView.value = null;

    // Create mock arena API
    mockArenaApi = {
      init: vi.fn().mockResolvedValue(undefined),
      createUnit: vi.fn().mockResolvedValue(undefined),
      clearAllUnits: vi.fn().mockResolvedValue(undefined),
      updateUnitHealth: vi.fn(),
      moveUnitToGrid: vi.fn(),
      setupDragEvents: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      getContainer: vi.fn().mockReturnValue(document.createElement("div")),
    } as unknown as CombatArenaApi;
  });

  it("should update enemy HP visually after successful attack", async () => {
    const { registerArena, executeAttack } = useCombatEngine();

    // Register mock arena
    registerArena(mockArenaApi);

    // Set attack result with 2 damage
    mockCurrentAttackView.value = { totalDamage: 2 };

    // Simulate attack on enemy-1 (had 7 HP, now has 5 HP after 2 damage)
    const target: CombatantDto = {
      id: "enemy-1",
      name: "Goblin",
      hp: 7, // HP BEFORE attack
      hpMax: 7,
      ac: 12,
      isPlayer: false,
      initiative: 5,
    };

    // Execute attack
    await executeAttack(target, undefined);

    // Verify updateUnitHealth was called with the target and damage amount
    expect(mockArenaApi.updateUnitHealth).toHaveBeenCalledWith("enemy-1", 2);
  });

  it("should not call updateUnitHealth if attack misses", async () => {
    const { registerArena, executeAttack } = useCombatEngine();

    registerArena(mockArenaApi);

    // Set attack result with 0 damage (miss)
    mockCurrentAttackView.value = { totalDamage: 0 };

    const target: CombatantDto = {
      id: "enemy-1",
      name: "Goblin",
      hp: 7,
      hpMax: 7,
      ac: 12,
      isPlayer: false,
      initiative: 5,
    };

    await executeAttack(target, undefined);

    // updateUnitHealth should NOT be called if no damage
    expect(mockArenaApi.updateUnitHealth).not.toHaveBeenCalled();
  });

  it("should handle enemy defeated (HP = 0)", async () => {
    const { registerArena, executeAttack } = useCombatEngine();

    registerArena(mockArenaApi);

    // Set attack result with 2 damage (killing blow)
    mockCurrentAttackView.value = { totalDamage: 2 };

    const target: CombatantDto = {
      id: "enemy-1",
      name: "Goblin",
      hp: 2, // Had 2 HP
      hpMax: 7,
      ac: 12,
      isPlayer: false,
      initiative: 5,
    };

    await executeAttack(target, undefined);

    // Should call updateUnitHealth with 2 damage
    expect(mockArenaApi.updateUnitHealth).toHaveBeenCalledWith("enemy-1", 2);
  });
});
