# Frontend Architecture Compliance Plan

**Date**: December 16, 2025
**Status**: 🔴 READY FOR IMPLEMENTATION (Awaiting User Go)
**Scope**: Frontend Vue 3 + Pinia + TanStack Query architecture compliance

---

## Executive Summary

Current architecture violates Vue Query best practices. The correct layering with Vue Query should be:

```
Components (UI rendering + user interaction)
    ↓
Composables (workflows + business logic using Vue Query)
    ↓
Stores (UI state only: modals, animations, selections)
    ↓
API Client (HTTP requests)
```

**Why Stores Should NOT Call API:**
1. Vue Query mutations already return reactive refs (`.data`, `.isPending`, `.error`)
2. Composables manage workflows, stores manage UI state only
3. No synchronization issues if data comes from mutations directly
4. Cleaner, more predictable data flow

**Current Problem:** combatStore and other stores directly call API via dynamic imports, violating this pattern.

---

## Current State Analysis

### Stores Violating Architecture

#### 1. **combatStore.ts** ⚠️ CRITICAL

**Location**: `apps/frontend/src/stores/combatStore.ts:70-117`

**Violations**:
- ✅ `clearCombat()` - GOOD, UI state only
- ✅ `resetModalState()` - GOOD, UI state only
- ❌ `startCombat()` - **WORKFLOW**, imports `useCombatApi` dynamically
- ❌ `fetchStatus()` - **DATA FETCHING**, imports composable
- ❌ `endActivation()` - **WORKFLOW**, imports composable
- ❌ `performAttack()` - **WORKFLOW**, imports composable
- ❌ `endCombatSession()` - **WORKFLOW**, imports composable

**Dynamic Imports** (Anti-pattern):
```typescript
// Lines 71-73, 81-83, 90-92, 106-108
const { useCombatApi } = await import("../composables/useCombatStatus");
const combatApi = useCombatApi();
// ... then calls combatApi.mutateAsync()
```

#### 2. **characterStore.ts** ⚠️ NEEDS AUDIT

**Concern**: May have similar API calls in inventory/spell management methods

#### 3. **gameStore.ts** ✅ APPEARS CLEAN

**Assessment**: Only has UI state (messages, flags, input), no API calls detected

---

## What Needs to Change

### Architecture Rules (Vue Query)

**✅ SHOULD BE in Composables:**
1. API calls via Vue Query mutations (`.mutateAsync()`)
2. Query refetch logic
3. Data transformation
4. Workflow orchestration (multi-step operations)
5. Error handling
6. Loading states management

**✅ SHOULD BE in Stores:**
1. Modal open/close state
2. Animation flags (isProcessing, isAnimating)
3. Temporary selections (currentTarget)
4. Temporary data for display (currentAttackView)
5. UI queues (attackResultQueue)

**❌ SHOULD NEVER BE in Stores:**
1. Direct API calls
2. `.mutateAsync()` invocations
3. Dynamic imports of composables
4. Data fetching logic

---

## Migration Plan

### Phase 1: Audit & Document Current State

**Files to Audit:**
- [x] combatStore.ts - **IDENTIFIED: 5 workflow actions**
- [ ] characterStore.ts - **TO AUDIT**
- [ ] gameStore.ts - **APPEARS CLEAN**
- [ ] All composables for proper Vue Query usage

**Stores Calling Dynamic Imports to Remove:**
1. combatStore.startCombat()
2. combatStore.fetchStatus()
3. combatStore.endActivation()
4. combatStore.performAttack()
5. combatStore.endCombatSession()

---

### Phase 2: Refactor combatStore (CRITICAL)

**Goal**: combatStore has ONLY UI state + animation helpers

**Current State:**
```typescript
// Line 70-117
startCombat() { /* dynamic import */ }
fetchStatus() { /* dynamic import */ }
endActivation() { /* dynamic import */ }
performAttack() { /* dynamic import */ }
endCombatSession() { /* dynamic import */ }
```

**After Refactor:**
```typescript
// UI state ONLY - no API calls
const showAttackResultModal = ref(false);
const currentTarget = ref(null);
const currentAttackView = ref(null);
// ... animation helpers only
const clearCombat = () => { /* reset UI */ };
const resetModalState = () => { /* reset modals */ };
```

**Remove These Actions:**
- ❌ `startCombat()` → Move to composable
- ❌ `fetchStatus()` → Move to composable
- ❌ `endActivation()` → Move to composable
- ❌ `performAttack()` → Move to composable
- ❌ `endCombatSession()` → Move to composable

**Keep These Actions:**
- ✅ `clearCombat()` - Resets UI
- ✅ `resetModalState()` - Resets modals
- ✅ `processAttackLogs()` - Animation helper
- ✅ `processOneAttackLog()` - Animation helper

---

### Phase 3: Move Workflows to Composables

**File**: `apps/frontend/src/composables/useCombat.ts`

**Add These Functions:**
```typescript
/**
 * Start a new combat session
 * Currently: combatStore.startCombat()
 */
export const startCombat = async (
  characterId: string,
  instruction: CombatStartRequestDto
): Promise<CombatActionResponseDto> => {
  const combatApi = useCombatApi();
  const response = await combatApi.startCombat.mutateAsync({
    characterId,
    data: instruction,
  });
  
  // Update store UI state if needed (e.g., select first enemy)
  const combatStore = useCombatStore();
  if (response.enemies?.length > 0) {
    combatStore.currentTarget = response.enemies[0];
  }
  
  return response;
};

/**
 * Refetch combat status
 * Currently: combatStore.fetchStatus()
 */
export const fetchCombatStatus = async (): Promise<void> => {
  const combatApi = useCombatApi();
  await combatApi.status.refetch();
};

/**
 * End player activation (turn)
 * Currently: combatStore.endActivation()
 */
export const endActivation = async (
  characterId: string
): Promise<EndPlayerTurnResponseDto> => {
  const combatApi = useCombatApi();
  const response = await combatApi.endTurn.mutateAsync(characterId);
  
  // Update UI state
  const combatStore = useCombatStore();
  if (response.attackLogs?.length) {
    await combatStore.processAttackLogs(response.attackLogs);
  }
  
  // Auto-select next target
  const combatInfo = useCombatInfo();
  const enemies = combatInfo.enemies.value ?? [];
  combatStore.currentTarget = selectNextAliveTarget(enemies);
  
  return response;
};

// Similar for performAttack, endCombatSession...
```

---

### Phase 4: Remove Pass-Through Wrappers

**File**: `apps/frontend/src/composables/useCombatStatus.ts`

**Current (Line 18-22):**
```typescript
export function useCombatApi() {
  const characterId = useCharacterId();
  return useCombat(characterId);
}
```

**Problem**: No value added, just wraps `useCharacterId() + useCombat()`

**Solution**: Remove this function entirely. Use directly:
```typescript
// Instead of:
const combatApi = useCombatApi();

// Use:
const characterId = useCharacterId();
const combatApi = useCombat(characterId);
```

**Files to Update** (search for `useCombatApi`):
- combatStore.ts (remove all imports)
- useCombat.ts (replace with direct call)
- useCombatEngine.ts (replace with direct call)
- CombatHeader.vue (replace with direct call)
- CombatEndModal.vue (replace with direct call)

---

### Phase 5: Update Components Calling Store Actions

**Current Pattern** (❌ WRONG):
```typescript
// Component
const combatStore = useCombatStore();
await combatStore.startCombat(characterId, instruction);
```

**New Pattern** (✅ RIGHT):
```typescript
// Component
import { startCombat } from "@/composables/useCombat";
await startCombat(characterId, instruction);
```

**Components to Update:**
- CombatPanel.vue - Calls `combatStore.startCombat()`
- CombatHeader.vue - Calls `combatStore.endActivation()`
- SpellSelector.vue - Calls `combatStore.performAttack()`
- GameView.vue - References store actions
- useCombatEngine.ts - Uses `combatStore.startCombat()` pattern

---

### Phase 6: Fix Type Errors

**Current Errors** (32+ issues):

1. **combatStore properties not found**
   - `combatStore.enemies` - Should use `useCombatInfo().enemies`
   - `combatStore.player` - Should use `useCombatInfo().player`
   - `combatStore.inCombat` - Should use `useCombatInfo().inCombat`
   - `combatStore.canPlayerAct` - Compute from `useCombatInfo()`

2. **Missing gameStore properties**
   - `gameStore.showDeathModal` - Add to gameStore
   - Missing methods/properties

3. **API client mismatches**
   - `character.useInventoryItem` - Use correct mutation
   - Fix attack mutation signature

---

## Implementation Checklist

### Before Implementation
- [ ] User approves this plan
- [ ] Backup current state
- [ ] Create feature branch

### Step 1: Refactor combatStore
- [ ] Remove `startCombat()` action
- [ ] Remove `fetchStatus()` action
- [ ] Remove `endActivation()` action
- [ ] Remove `performAttack()` action
- [ ] Remove `endCombatSession()` action
- [ ] Keep only UI state + animation helpers
- [ ] Update return statement

### Step 2: Add Workflows to useCombat.ts
- [ ] Add `startCombat()` function
- [ ] Add `fetchCombatStatus()` function
- [ ] Add `endActivation()` function
- [ ] Add `performAttack()` wrapper
- [ ] Add `endCombatSession()` function
- [ ] Export all functions

### Step 3: Remove useCombatApi() Wrapper
- [ ] Delete `useCombatApi()` from useCombatStatus.ts
- [ ] Update combatStore.ts imports
- [ ] Update useCombat.ts imports
- [ ] Update useCombatEngine.ts imports
- [ ] Update CombatHeader.vue imports
- [ ] Update CombatEndModal.vue imports

### Step 4: Update Components
- [ ] CombatPanel.vue - Replace store action calls
- [ ] CombatHeader.vue - Use composable directly
- [ ] SpellSelector.vue - Use composable directly
- [ ] useCombatEngine.ts - Use composable functions
- [ ] All other combat components

### Step 5: Fix Type Errors
- [ ] Fix combatStore property access → use useCombatInfo()
- [ ] Add missing gameStore properties
- [ ] Fix API client mismatches
- [ ] Run type-check

### Step 6: Verify
- [ ] Build frontend: `npm run build`
- [ ] Type check passes: `npm run type-check`
- [ ] Lint clean: `npm run lint`
- [ ] E2E tests pass (if applicable)

---

## Files to Modify

### High Priority (Critical Path)
1. **combatStore.ts** - Remove workflow actions
2. **useCombat.ts** - Add workflow functions
3. **useCombatStatus.ts** - Remove pass-through wrapper
4. **CombatHeader.vue** - Update mutation usage
5. **CombatEndModal.vue** - Use direct mutation state

### Medium Priority (Components)
6. **CombatPanel.vue** - Update action calls
7. **useCombatEngine.ts** - Use composable directly
8. **SpellSelector.vue** - Update if needed
9. **GameView.vue** - Simplify store usage

### Low Priority (Cleanup)
10. **characterStore.ts** - Audit for similar violations
11. **All tests** - Update expectations

---

## Expected Outcomes

### Before (Problematic)
```
combatStore.startCombat() ─→ import useCombatApi() ─→ useCombat(characterId) ─→ API
  (Store calling composable)
```

### After (Correct)
```
Component ─→ useCombat.startCombat() ─→ useCombat(characterId) ─→ API
                                            ↓
                                    combatStore.updateUI()
  (Component calls composable, which updates store)
```

### Benefits
✅ Clear data flow: Component → Composable → Store → API
✅ No inverted dependencies
✅ Easier to test (mocking composables is easier)
✅ Better tree-shaking (unused store actions eliminated)
✅ Consistent with Vue Query philosophy
✅ Type safety improves
✅ Easier to reason about state

---

## Risk Assessment

### Low Risk
- No breaking changes to component public APIs
- No database migrations
- Purely internal refactoring

### Testing
- Unit tests for new composable functions
- E2E tests should still pass
- Manual combat flow testing recommended

### Rollback
- If issues arise, can revert easily (single PR)
- No production data affected

---

## Notes

- This plan assumes Vue Query is properly installed and configured ✅
- TanStack Query provides reactivity for mutations ✅
- Composables can update store UI state as side-effects ✅
- API calls belong ONLY in composables or API client layer ✅

**Key Principle**: *Stores are for UI state, not for orchestrating data flow.*

---

**Ready for**: `#github-pull-request_copilot-coding-agent` when user gives GO ✓
