/**
 * CombatModule Public API
 *
 * Defines what services from CombatModule can be imported by other modules.
 * This follows NestJS module encapsulation patterns.
 *
 * PUBLIC SERVICES (exported in module):
 * - CombatAppService: Main application facade for combat operations
 * - CombatOrchestrator: Complex multi-service workflows
 * - CombatGridService: Shared grid/positioning logic
 *
 * INTERNAL SERVICES (not exported, module-private):
 * - InitService, TurnOrderService, EnemyTurnService, ActionEconomyService
 * - These are implementation details and should not be imported directly
 */

export { CombatAppService } from "../domain/combat/combat.app.service.js";
export { CombatOrchestrator } from "../orchestrators/combat/index.js";
export { CombatGridService } from "../domain/combat/services/combat-grid.service.js";
