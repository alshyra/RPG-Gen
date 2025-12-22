// Backward compatibility - re-export from bounded context
export * from "../../bounded-contexts/combat/domain/index.js";
export * from "./dto/index.js";
export * from "./services/index.js";

// Re-export CombatAppService from application layer for backward compatibility
export { CombatAppService } from "../../bounded-contexts/combat/application/services/CombatAppService.js";
