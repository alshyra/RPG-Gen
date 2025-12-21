import { CharacterResponseDto } from '../../domain/character/dto/CharacterResponseDto.js';
import { DraftCharacterResponseDto } from '../../domain/character/dto/DraftCharacterResponseDto.js';
import type { CharacterDocument } from '../../infra/mongo/index.js';

/**
 * Returns appropriate response DTO based on character state.
 * Uses DraftCharacterResponseDto for draft characters,
 * otherwise returns CharacterResponseDto.
 * Note: CharacterResponseDto no longer requires portrait for characters in "created" state
 * as portrait may be generated after state transition.
 */
export function toCharacterResponse(
  character: CharacterDocument
): CharacterResponseDto | DraftCharacterResponseDto {
  // Use DraftCharacterResponseDto ONLY for draft state
  if (character.state === 'draft') {
    return new DraftCharacterResponseDto(character);
  }
  
  // Otherwise use CharacterResponseDto (portrait is optional now)
  return new CharacterResponseDto(character);
}
