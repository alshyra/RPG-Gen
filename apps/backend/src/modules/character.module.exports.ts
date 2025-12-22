/**
 * CharacterModule Public API
 *
 * Defines what services from CharacterModule can be imported by other modules.
 *
 * PUBLIC SERVICES (exported in module):
 * - CharacterAppService: Character CRUD and management (Clean Architecture)
 * - CharacterDtoMapper: Entity to DTO mapping with enrichment
 * - ItemDefinitionService: Item definitions and catalog
 * - ICharacterRepository: Repository interface for persistence
 *
 * INTERNAL SERVICES (not exported, module-private):
 * - Repository services, domain-specific validators
 * - These are implementation details and should not be imported directly
 */

export { CharacterAppService } from "../application/character/CharacterAppService.js";
export { CharacterDtoMapper } from "../api/character/dto/mappers/CharacterDtoMapper.js";
export { ItemDefinitionService } from "../domain/item-definition/item-definition.service.js";
export { ICharacterRepository } from "../domain/character/repositories/ICharacterRepository.js";
