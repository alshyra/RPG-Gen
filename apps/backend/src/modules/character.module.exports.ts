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

export { CharacterAppService } from "../bounded-contexts/character/application/services/CharacterAppService.js";
export { CharacterDtoMapper } from "../bounded-contexts/character/api/dto/mappers/CharacterDtoMapper.js";
export { ItemDefinitionService } from "../bounded-contexts/item/domain/services/ItemDefinitionService.js";
export { ICharacterRepository } from "../bounded-contexts/character/domain/repositories/ICharacterRepository.js";
