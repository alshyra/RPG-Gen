import {
  describe, it, expect, beforeEach, vi,
} from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCombatStore } from '@/stores/combatStore';
import { useCharacterStore } from '@/stores/characterStore';
import { useCombat } from './useCombat';
import { combatService } from '@/apis/combatApi';

describe('useCombat processAttackResult => currentAttackView', () => {
  beforeEach(() => {
    const pinia = createPinia();
    setActivePinia(pinia);
    vi.restoreAllMocks();
  });

  it('populates currentAttackView from attack response and previous state', async () => {
    const combatStore = useCombatStore();
    const charStore = useCharacterStore();

    // set player and enemies
    combatStore.player = {
      id: 'player-1',
      name: 'You',
      hp: 20,
    } as any;
    combatStore.enemies = [
      {
        id: 'enemy-1',
        name: 'Goblin',
        hp: 8,
        hpMax: 8,
      } as any,
    ];
    combatStore.actionRemaining = 1;
    combatStore.turnOrder = [
      {
        id: 'player-1',
        isPlayer: true,
        name: 'You',
      } as any,
    ];
    combatStore.currentTurnIndex = 0;

    charStore.currentCharacter = { characterId: 'char-1' } as any;

    // reduce animation delay to avoid long tests
    combatStore.PLAYER_ATTACK_DELAY_MS = 0;

    // Prepare fake API response (hit, target hp reduced)
    const fakeResponse = {
      diceResult: {
        rolls: [18],
        modifierValue: 5,
        total: 23,
      },
      damageDiceResult: {
        rolls: [3, 2],
        modifierValue: 0,
        total: 5,
        damageTotal: 5,
      },
      damageTotal: 5,
      isCrit: false,
      combatState: {
        characterId: 'char-1',
        inCombat: true,
        enemies: [
          {
            id: 'enemy-1',
            name: 'Goblin',
            hp: 3,
            hpMax: 8,
          },
        ],
        player: {
          id: 'player-1',
          name: 'You',
          hp: 20,
        },
        turnOrder: [],
        currentTurnIndex: 0,
        roundNumber: 1,
      },
    } as any;

    vi.spyOn(combatService, 'attack')
      .mockResolvedValue(fakeResponse);

    const { executeAttack } = useCombat();

    // call executeAttack with the target
    await executeAttack(combatStore.enemies[0] as any);

    expect(combatStore.currentAttackView)
      .toBeTruthy();
    expect(combatStore.currentAttackView?.target)
      .toBe('Goblin');
    expect(combatStore.currentAttackView?.totalDamage)
      .toBe(5);
    expect(combatStore.currentAttackView?.targetHpBefore)
      .toBe(8);
    expect(combatStore.currentAttackView?.targetHpAfter)
      .toBe(3);
    expect(combatStore.currentAttackView?.targetDefeated)
      .toBe(false);
  });
});
