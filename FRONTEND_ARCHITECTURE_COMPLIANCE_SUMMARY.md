# Architecture Compliance Summary

## Current vs Target Architecture

### ❌ CURRENT (PROBLEMATIC)

```
Components
  ↓ (call store actions)
combatStore.startCombat() ← ← ← ← ←
  ↓ (dynamic import of composable)
useCombatApi() [pass-through wrapper]
  ↓ (calls API)
combatApi.startCombat.mutateAsync()
  ↓
API
```

**Problems:**
- Store imports composable (inverted dependency)
- Workflow logic in store (belongs in composable)
- useCombatApi() adds no value (just wraps useCharacterId + useCombat)
- Hard to test, confusing data flow

---

### ✅ TARGET (CORRECT)

```
Components
  ↓
Composables (workflows)
  ├─→ Vue Query Mutations/Queries (data layer)
  │   └─→ mutation.data, mutation.isPending, mutation.error
  │       (reactive, auto-updated by Vue Query)
  │
  └─→ Pinia Stores (UI state only)
      └─→ currentTarget, showModal, currentAttackView
          (UI state, selections, animations)

Components access:
  - combatApi.status.data (for combat data)
  - combatStore.currentTarget (for UI selections)
```

**Benefits:**
- Clear separation: Vue Query = data, Stores = UI state
- No data duplication (mutation.data is source of truth)
- Workflow logic in composables (where it belongs)
- No unnecessary wrappers
- Easy to test (mock composables)
- Vue Query reactivity works directly

---

## What Changes

### combatStore.ts

**REMOVE** (5 actions with API calls):
```typescript
❌ startCombat() - imports useCombatApi dynamically
❌ fetchStatus() - imports useCombatApi dynamically
❌ endActivation() - imports useCombatApi dynamically
❌ performAttack() - imports useCombatApi dynamically
❌ endCombatSession() - imports useCombatApi dynamically
```

**KEEP** (3 UI helpers):
```typescript
✅ clearCombat() - resets UI state
✅ resetModalState() - resets modals
✅ processAttackLogs() - animation processing
```

---

### useCombat.ts

**ADD** (5 workflow functions):
```typescript
✅ startCombat(characterId, instruction)
✅ fetchCombatStatus()
✅ endActivation(characterId)
✅ performAttack(target, spellName)
✅ endCombatSession(characterId)
```

---

### useCombatStatus.ts

**REMOVE** (1 pass-through wrapper):
```typescript
❌ useCombatApi() - no value added
```

Replace all usages with direct calls:
```typescript
// Before
const combatApi = useCombatApi();

// After
const characterId = useCharacterId();
const combatApi = useCombat(characterId);
```

---

## Files Affected

| File | Change | Priority |
|------|--------|----------|
| combatStore.ts | Remove 5 actions | 🔴 Critical |
| useCombat.ts | Add 5 functions | 🔴 Critical |
| useCombatStatus.ts | Remove 1 wrapper | 🔴 Critical |
| CombatHeader.vue | Update mutations | 🟡 High |
| CombatEndModal.vue | Use mutation state | 🟡 High |
| CombatPanel.vue | Call composable not store | 🟡 High |
| useCombatEngine.ts | Use composable directly | 🟡 High |
| SpellSelector.vue | Update if using store actions | 🟢 Medium |
| GameView.vue | Simplify store usage | 🟢 Medium |
| characterStore.ts | Audit for similar issues | 🟢 Medium |

---

## Type Errors to Fix

After refactoring, these type errors will be resolved:

| Error | Cause | Fix |
|-------|-------|-----|
| `combatStore.enemies not found` | Trying to access removed property | Use `useCombatInfo().enemies` |
| `combatStore.player not found` | Trying to access removed property | Use `useCombatInfo().player` |
| `combatStore.inCombat not found` | Trying to access removed property | Use `useCombatInfo().inCombat` |
| `useCombatApi` not found after removal | Function deleted | Use `useCombat(characterId)` directly |

---

## Data Flow Examples

### Example 1: Starting Combat

**OLD** (❌):
```typescript
// Component
await combatStore.startCombat(characterId, instruction);

// combatStore action
const { useCombatApi } = await import(...);
const combatApi = useCombatApi();
await combatApi.startCombat.mutateAsync(...);
```

**NEW** (✅):
```typescript
// Component
import { startCombat } from "@/composables/useCombat";
await startCombat(characterId, instruction);

// Composable function
export const startCombat = async (...) => {
  const combatApi = useCombat(characterId);
  const response = await combatApi.startCombat.mutateAsync(...);
  combatStore.currentTarget = response.enemies[0];
  return response;
};
```

### Example 2: Ending Turn

**OLD** (❌):
```typescript
// Component
await combatStore.endActivation(characterId);

// combatStore dynamically imports
```

**NEW** (✅):
```typescript
// Component or composable
import { endActivation } from "@/composables/useCombat";
await endActivation(characterId);

// Direct call in composable
const combatApi = useCombat(characterId);
await combatApi.endTurn.mutateAsync(characterId);
```

---

## Metrics

### Code Reduction
- **combatStore**: 5 actions removed = ~40 lines
- **useCombatStatus**: 1 function removed = ~5 lines
- **Total**: ~45 lines of unnecessary code removed

### Type Safety
- **Before**: 32+ type errors
- **After**: ~0 type errors (from this refactoring)
- **Estimated fix time**: 2-3 hours for full implementation

### Architecture Score
- **Before**: ⚠️ Layering violations in 30% of stores
- **After**: ✅ 100% compliant with Vue Query patterns

---

## Implementation Time Estimate

| Phase | Estimate | Notes |
|-------|----------|-------|
| Phase 1: Audit | 30 min | Already done ✓ |
| Phase 2: Refactor combatStore | 30 min | Remove actions |
| Phase 3: Move to composables | 1 hour | Add workflow functions |
| Phase 4: Remove wrappers | 30 min | Delete useCombatApi |
| Phase 5: Update components | 1 hour | 5-8 files |
| Phase 6: Fix type errors | 1 hour | Update usages |
| Testing & verification | 30 min | Build + type-check |
| **TOTAL** | **~4.5 hours** | Full compliance |

---

## Success Criteria

✅ **All of the following must be true:**
1. `npm run build` passes (9.5s target)
2. `npm run type-check` passes (0 errors)
3. `npm run lint` passes
4. combatStore has NO API calls
5. All workflow functions in composables
6. useCombatApi() deleted
7. Components call composables, not store actions
8. No dynamic imports in stores
9. All tests pass

---

## Ready for Implementation

🟢 **Status**: READY
📋 **Documents Created**:
- ✅ `FRONTEND_ARCHITECTURE_COMPLIANCE_PLAN.md` (detailed plan)
- ✅ `FRONTEND_ARCHITECTURE_COMPLIANCE_SUMMARY.md` (this file)
- ✅ `ARCHITECTURE_QUALITY_ANALYSIS.md` (updated with findings)

⏳ **Awaiting**: User approval to proceed with implementation via `#github-pull-request_copilot-coding-agent`

---

**Last Updated**: December 16, 2025
**Prepared by**: GitHub Copilot
**Next Step**: User says "GO" → Execute full refactoring
