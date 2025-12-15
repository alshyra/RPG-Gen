# CombatModule - Public API Contract

## Exported Services (Public API)

Ces services sont exportés et peuvent être utilisés par d'autres modules:

### `CombatAppService`

**Purpose**: Facade pour toutes les opérations de combat  
**Used by**: CombatOrchestrator, tests  
**Public methods**:

- `initializeCombat(characterId, request)` - Démarre un combat
- `saveCombatState(state)` - Persiste l'état du combat
- `getCombatState(characterId)` - Récupère l'état actuel
- `processEnemyTurns(...)` - Exécute les tours ennemis

### `CombatOrchestrator`

**Purpose**: Orchestre les workflows de combat complets  
**Used by**: CombatController  
**Public methods**:

- `startCombat(userId, characterId, request)` - Workflow complet d'init
- `endPlayerTurn(userId, characterId)` - Workflow de fin de tour joueur

### `CombatGridService`

**Purpose**: Gestion de la grille de combat et positions  
**Used by**: CombatMovementOrchestrator  
**Public methods**:

- `calculateDistance(pos1, pos2)` - Distance entre positions
- `isValidPosition(state, position)` - Validation de position

## Internal Services (Not Exported)

Ces services sont internes au module et ne doivent pas être utilisés ailleurs:

- `InitService` - Calcul d'initiative (used internally by CombatAppService)
- `TurnOrderService` - Gestion de l'ordre des tours
- `ActionEconomyService` - Gestion des actions/bonus actions
- `EnemyTurnService` - Logique des tours ennemis
- `OpportunityAttackResolver` - Résolution des attaques d'opportunité

## Module Dependencies

**Imports**:

- `CharacterModule` → `CharacterAppService` (for character data)
- `DiceModule` → `DiceService` (for dice rolls)
- `ChatModule` (forwardRef) → `ChatOrchestrator` (for narrative)

**Circular Dependencies**:

- ⚠️ `ChatModule` uses `forwardRef` - be careful when refactoring

## Usage Examples

```typescript
// ✅ GOOD - Use exported orchestrator
import { CombatOrchestrator } from "./modules/combat.module";

@Controller()
class MyController {
  constructor(private combat: CombatOrchestrator) {}
}

// ❌ BAD - Don't import internal services
import { InitService } from "../domain/combat/services/init.service";
```

## Breaking Changes History

- **Dec 15, 2025**: Added `EnemyTurnService`, refactored enemy turn logic
- **Dec 10, 2025**: Changed `CombatActionResponseDto` return type (was `AttackResponseDto`)
