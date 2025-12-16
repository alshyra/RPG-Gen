/**
 * Character Spells Store Module
 * Domain-specific refs and logic for spell management
 */

import type { CharacterResponseDto, SpellInstructionMessageDto, SpellResponseDto } from '@rpg-gen/shared';
import type { Ref } from 'vue';

const convertSpellInstructionToDto = (spell: SpellInstructionMessageDto): SpellResponseDto => {
  if (!spell) throw new Error('spell is required');
  if (!spell.definitionId || typeof spell.definitionId !== 'string' || !spell.definitionId.trim()) {
    throw new Error('spell.definitionId is required and must be a non-empty string');
  }
  if (!spell.name || typeof spell.name !== 'string' || !spell.name.trim()) {
    throw new Error('spell.name is required and must be a non-empty string');
  }
  if (spell.level === undefined || spell.level === null || typeof spell.level !== 'number') {
    throw new Error('spell.level is required and must be a number');
  }

  if (spell.meta === undefined || spell.meta === null || typeof spell.meta !== 'object') {
    throw new Error('spell.meta is required and must be an object');
  }
  return {
    name: spell.name,
    level: spell.level,
    description: spell.description,
    definitionId: spell.definitionId,
    meta: spell.meta,
  };
};

/**
 * Create spell manager for a character ref
 */
export function createSpellManager(charRef: Ref<CharacterResponseDto | undefined>) {
  const learn = (spell: SpellInstructionMessageDto) => {
    if (!charRef.value) return;

    if (
      charRef.value.spells &&
      charRef.value.spells.some(s => s.definitionId === spell.definitionId)
    )
      return;
    charRef.value = {
      ...charRef.value,
      spells: [...(charRef.value.spells || []), convertSpellInstructionToDto(spell)],
    };
  };

  const forget = (name: string) => {
    if (!charRef.value) return;
    charRef.value = {
      ...charRef.value,
      spells: (charRef.value.spells || []).filter(s => s.name !== name),
    };
  };

  return {
    learn,
    forget,
  };
}
