/**
 * CharacterModule Public API
 *
 * Defines what services from CharacterModule can be imported by other modules.
 *
 * PUBLIC SERVICES (exported in module):
 * - CharacterService: Character CRUD and management
 * - ItemDefinitionService: Item definitions and catalog
 * - SpellDefinitionService: Spell definitions and catalog
 *
 * INTERNAL SERVICES (not exported, module-private):
 * - Repository services, domain-specific validators
 * - These are implementation details and should not be imported directly
 */

export { CharacterService } from "../domain/character/character.service.js";
export { ItemDefinitionService } from "../domain/item-definition/item-definition.service.js";
