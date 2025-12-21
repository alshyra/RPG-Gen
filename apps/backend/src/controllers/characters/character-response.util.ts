import { CharacterResponseDto } from '../../domain/character/dto/CharacterResponseDto.js';
import { DraftCharacterResponseDto } from '../../domain/character/dto/DraftCharacterResponseDto.js';
import type { CharacterDocument } from '../../infra/mongo/index.js';

/**
 * Returns appropriate response DTO based on character state and portrait presence.
 * Uses DraftCharacterResponseDto for draft characters or when portrait is missing,
 * otherwise returns CharacterResponseDto with strict validation.
 */
export function toCharacterResponse(
  character: CharacterDocument
): CharacterResponseDto | DraftCharacterResponseDto {
  // Use DraftCharacterResponseDto if character is in draft state OR missing portrait
  if (character.state === 'draft' || !character.portrait) {
    return new DraftCharacterResponseDto(character);
  }
  
  // Otherwise use strict CharacterResponseDto which validates portrait presence
  return new CharacterResponseDto(character);
}
