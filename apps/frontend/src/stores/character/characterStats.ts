/**
 * Character Stats Store Module
 * Domain-specific refs and logic for HP, XP, inspiration
 */

import { characterApi } from '@rpg-gen/api-client';
import type { CharacterResponseDto } from '@rpg-gen/shared';
import type { Ref } from 'vue';
import { useCombatStore } from '../combatStore';

/**
 * Create HP updater that syncs with combat store
 */
export function createHpUpdater(charRef: Ref<CharacterResponseDto | undefined>) {
  return (delta: number) => {
    if (!charRef.value) return;
    charRef.value.hp = Math.max(0, (charRef.value.hp || 0) + delta);
    if (charRef.value.hp === 0) charRef.value.isDeceased = true;
    
    // Also update combat state player hp if in combat
    const combatStore = useCombatStore();
    if (
      combatStore.inCombat &&
      combatStore.player &&
      combatStore.player.id === charRef.value.characterId
    ) {
      combatStore.player = {
        ...combatStore.player,
        hp: Math.max(0, (combatStore.player.hp ?? 0) + delta),
      };
    }
  };
}

/**
 * Create XP updater
 */
export function createXpUpdater(charRef: Ref<CharacterResponseDto | undefined>) {
  return (xp: number) => {
    if (!charRef.value) return;
    charRef.value.totalXp = (charRef.value.totalXp || 0) + xp;
  };
}

/**
 * Create inspiration manager
 */
export function createInspirationManager(currentCharacter: Ref<CharacterResponseDto | undefined>) {
  const grantInspiration = async (amount = 1) => {
    if (!currentCharacter.value?.characterId) return;
    const result = await characterApi.grantInspiration(currentCharacter.value.characterId, {
      amount,
    });
    if (result.character) {
      currentCharacter.value = result.character;
    }
  };

  const spendInspiration = async () => {
    if (!currentCharacter.value?.characterId) return;
    const result = await characterApi.spendInspiration(currentCharacter.value.characterId);
    if (result.character) {
      currentCharacter.value = result.character;
    }
  };

  return {
    grantInspiration,
    spendInspiration,
  };
}
