# Store Refactoring Status

## ✅ Completed: characterStore.ts
**Before:** 225 lines with mixed responsibilities  
**After:** 85 lines using domain-driven modules  

### Domain Modules Created:
- `character/characterStats.ts` - HP, XP, inspiration management
- `character/characterSpells.ts` - Spell learning/forgetting
- `character/characterInventory.ts` - Inventory add/remove/use (fixed type error: Partial<InventoryItemDto> → InventoryItemDto)

### Benefits:
- Fixed type error: `addInventoryItem` now requires complete `InventoryItemDto` with `definitionId`
- Clear separation of concerns (health, progression, magic, inventory)
- Each domain module is independently testable
- Reduced store to ~85 lines (62% reduction)

---

## 🔄 Pending: combatStore.ts (281 lines)
**Status:** Domain modules created but not integrated yet  

### Domain Modules Created (not yet integrated):
- `combat/combatState.ts` - Core combat lifecycle (inCombat, rounds, turn order, phases)
- `combat/combatActions.ts` - Action economy (action points, bonus actions, targeting)
- `combat/combatUI.ts` - UI state (modals, attack results, animations)

### Functions to migrate (22 total):
**State management (8):**
- setCombatParticipants, setCombatState, setActionEconomy
- initializeCombat, applyTurnCombatState, applyTurnActionEconomy
- updateFromTurnResult, updateEnemiesOnly

**Reset/Clear (5):**
- resetCombatParticipants, resetCombatState, resetActionEconomy
- resetModalState, clearCombat

**Attack processing (3):**
- processOneAttackLog, processAttackLogs, applyDamageToPlayer

**API calls (3):**
- startCombat, fetchStatus, endActivation

**Utilities (3):**
- selectNextAliveTarget, checkCombatEnd, delay

### Recommended split:
1. **combatState.ts** - Add state management functions
2. **combatActions.ts** - Add action economy + targeting logic
3. **combatUI.ts** - Add attack processing + modal management
4. **combatAPI.ts** (new) - API orchestration (startCombat, fetchStatus, endActivation)

---

## ✅ OK: gameStore.ts (102 lines)
**Status:** Acceptable size, focused on game session and message state  

### Responsibilities:
- Dice rolling (`doRoll`)
- Message history management (`appendMessage`, `updateMessages`)
- Game session state (pending instruction, player text, loading flags)
- Roll modal UI state

**Recommendation:** Keep as-is. Clear single responsibility (game session orchestration).

---

## ✅ OK: uiStore.ts (31 lines)
**Status:** Small, focused on UI state  

---

## Type Errors Fixed
All frontend type errors resolved:
- ✅ `addInventoryItem` parameter changed from `Partial<InventoryItemDto>` to `InventoryItemDto`
- ✅ Removed unused imports (`InventoryItemDto`, `SpellInstructionMessageDto` from characterStore)

---

## Next Steps
1. **Complete combatStore refactoring** (highest priority)
   - Integrate domain modules (combatState, combatActions, combatUI)
   - Create combatAPI module for API orchestration
   - Migrate 22 functions to appropriate domains
   
2. **Run tests**
   - Verify characterStore changes don't break existing functionality
   - Run `npm --workspace @rpg-gen/frontend run test`
   - Check E2E tests if available

3. **Documentation**
   - Update README if needed
   - Add JSDoc comments to new domain modules
