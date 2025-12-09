import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { useCombatEngine, type CombatArenaApi } from '@/composables/useCombatEngine';
import type { CombatEngineEventPayload } from '@rpg-gen/combat-engine';
import { setActivePinia, createPinia } from 'pinia';
import { ref } from 'vue';

// Mock the backend combat composable
vi.mock('@/composables/useCombat', () => ({
  useCombat: () => ({
    executeAttack: vi.fn()
      .mockResolvedValue({}),
  }),
}));

// Create mock store state as refs
const mockEnemies = ref([
  {
    id: 'enemy-1',
    name: 'Goblin',
    hp: 20,
    hpMax: 20,
  },
  {
    id: 'enemy-2',
    name: 'Orc',
    hp: 30,
    hpMax: 30,
  },
]);
const mockPlayer = ref({
  id: 'player-1',
  name: 'Hero',
  hp: 50,
  hpMax: 50,
});
const mockCurrentCharacter = ref({
  characterId: 'char-1',
  spells: [],
});

// Mock stores
vi.mock('@/stores/combatStore', () => ({
  useCombatStore: () => ({
    enemies: mockEnemies,
    player: mockPlayer,
    inCombat: true,
    turnOrder: [],
    currentTurnIndex: 0,
    roundNumber: 1,
    phase: 'PLAYER_TURN',
    actionRemaining: 1,
    actionMax: 1,
  }),
}));

vi.mock('@/stores/characterStore', () => ({
  useCharacterStore: () => ({
    currentCharacter: mockCurrentCharacter,
  }),
}));

describe('useCombatEngine', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  const createMockArenaApi = (): CombatArenaApi & {
    handlers: Map<keyof CombatEngineEventPayload, ((payload: unknown) => void)[]>;
  } => {
    const handlers = new Map<keyof CombatEngineEventPayload, ((payload: unknown) => void)[]>();

    return {
      handlers,
      init: vi.fn()
        .mockResolvedValue(undefined),
      createUnit: vi.fn()
        .mockResolvedValue({}),
      updateUnitHealth: vi.fn(),
      moveUnitToGrid: vi.fn(),
      setupDragEvents: vi.fn(),
      getContainer: vi.fn()
        .mockReturnValue(null),
      on: vi.fn((event, handler) => {
        if (!handlers.has(event)) {
          handlers.set(event, []);
        }
        handlers.get(event)!.push(handler);
      }),
      off: vi.fn((event, handler) => {
        const eventHandlers = handlers.get(event);
        if (eventHandlers) {
          const index = eventHandlers.indexOf(handler);
          if (index > -1) eventHandlers.splice(index, 1);
        }
      }),
      emit: vi.fn((event, payload) => {
        handlers.get(event)
          ?.forEach(h => h(payload));
      }),
    };
  };

  it('should register arena and subscribe to events', () => {
    const { registerArena } = useCombatEngine();
    const mockApi = createMockArenaApi();

    registerArena(mockApi);

    expect(mockApi.on)
      .toHaveBeenCalledWith('unit:clicked', expect.any(Function));
  });

  it('should open modal when enemy is clicked', () => {
    const {
      registerArena, isActionModalOpen, selectedTarget,
    } = useCombatEngine();
    const mockApi = createMockArenaApi();

    registerArena(mockApi);

    // Simulate enemy click
    mockApi.emit('unit:clicked', {
      unitId: 'enemy-1',
      isPlayer: false,
    });

    expect(isActionModalOpen.value)
      .toBe(true);
    expect(selectedTarget.value)
      .toEqual({
        id: 'enemy-1',
        name: 'Goblin',
        hp: 20,
        hpMax: 20,
      });
  });

  it('should NOT open modal when player unit is clicked', () => {
    const {
      registerArena, isActionModalOpen, selectedTarget,
    } = useCombatEngine();
    const mockApi = createMockArenaApi();

    registerArena(mockApi);

    // Simulate player click
    mockApi.emit('unit:clicked', {
      unitId: 'player-1',
      isPlayer: true,
    });

    expect(isActionModalOpen.value)
      .toBe(false);
    expect(selectedTarget.value)
      .toBeNull();
  });

  it('should close modal on closeActionModal', () => {
    const {
      registerArena, isActionModalOpen, closeActionModal,
    } = useCombatEngine();
    const mockApi = createMockArenaApi();

    registerArena(mockApi);
    mockApi.emit('unit:clicked', {
      unitId: 'enemy-1',
      isPlayer: false,
    });

    expect(isActionModalOpen.value)
      .toBe(true);

    closeActionModal();

    expect(isActionModalOpen.value)
      .toBe(false);
  });

  it('should unregister handlers on unregisterArena', () => {
    const {
      registerArena, unregisterArena,
    } = useCombatEngine();
    const mockApi = createMockArenaApi();

    registerArena(mockApi);
    expect(mockApi.on)
      .toHaveBeenCalled();

    unregisterArena();
    expect(mockApi.off)
      .toHaveBeenCalled();
  });
});
