# Architecture & Code Quality Analysis — RPG-Gen

**Date**: December 15, 2025
**Project**: RPG-Gen Monorepo
**Scope**: Full-stack TypeScript/Vue3 RPG game with NestJS backend and MongoDB

---

## Executive Summary

RPG-Gen exhibits **good foundational architecture** with clear domain-driven design (DDD) principles and well-defined separation of concerns. However, there are opportunities to improve **type safety**, **test coverage**, and **code standardization**. The project is well-positioned for growth but would benefit from stricter governance on type casting and improved documentation.

### Key Strengths

✅ Clear layered architecture (Controller → Orchestrator → AppService → DomainServices)
✅ Module-based organization following NestJS best practices
✅ Automated type generation from OpenAPI spec (keeping frontend/backend in sync)
✅ DDD principles applied to combat and character domains
✅ Good separation of concerns with orchestrators coordinating workflows

### Key Issues

⚠️ **302 type assertions** (`as`, `as unknown as`) scattered throughout codebase
⚠️ **Low test coverage** (~13% of codebase is tests)
⚠️ **Some architectural violations** (domain services importing cross-domain services)
⚠️ **Inconsistent error handling** across modules
⚠️ **Missing input validation** in some controllers

---

## Architecture Analysis

### 1. Overall Structure

```
apps/backend/
├── controllers/         # HTTP entry points (thin layer)
├── domain/             # Domain services & business logic (organized by domain)
├── infra/              # Infrastructure: Mongoose models, external services
├── modules/            # NestJS module definitions (DI configuration)
├── orchestrators/      # Workflow orchestration (multi-domain coordination)
└── scripts/            # Setup & generation scripts

apps/frontend/
├── components/         # Vue 3 UI components
├── stores/            # Pinia state management
├── composables/       # Reusable Vue 3 composition functions
├── apis/              # Backend API clients
└── services/          # Business logic & utilities

packages/shared/
├── api-types.ts       # Generated from OpenAPI spec
└── index.ts           # Type re-exports & aliases

packages/api-client/   # NEW: Centralized API client
├── src/
│   └── index.ts      # Type-safe openapi-fetch wrapper
└── README.md         # Usage documentation
```

**Assessment**: ✅ **GOOD**

- Clear separation of concerns
- Easy to locate related functionality
- Each domain has its own service layer (e.g., `domain/combat/`, `domain/character/`)
- Orchestrators provide coordination layer for complex workflows

**Recommendations**:

2. Document module export contracts in `modules/*.module.ts` - See example in `combat.module.exports.md`
3. Add architectural decision records (ADRs) when patterns stabilize (project is 1 month old, defer for now)

### 2. Layering & Data Flow

**Expected Flow**: Controller → Orchestrator → AppService → DomainServices → Persistence

Example (Combat):

```
CombatController
  ↓
CombatOrchestrator
  ↓
CombatAppService + CombatActionOrchestrator
  ↓
InitService, TurnOrderService, ActionEconomyService, EnemyTurnService
  ↓
CombatSessionModel (MongoDB)
```

**Assessment**: ✅ **MOSTLY GOOD** with ⚠️ **Minor violations**

✅ Combat module: Exemplary layering (see ARCHI.md)
✅ Character module: Clean separation between CharacterService & CharacterAppService
⚠️ Chat module: Some cross-domain imports (ConversationService imports CharacterResponseDto directly)
⚠️ Image module: Uses Gemini services without orchestrator abstraction

**Recommendation**: ~~Create architectural tests to enforce module boundaries~~ ✅ **Example created** - See `apps/backend/test/architecture/module-boundaries.spec.ts`

```typescript
// test/architecture.spec.ts
it("domain services should not import from other domains", () => {
  // Use es-module-lexer or similar to scan imports
  // Fail if domain/combat/* imports from domain/character/*
});
```

### 3. Type Safety

**Current State**:

| Metric                  | Value   | Assessment         |
| ----------------------- | ------- | ------------------ |
| Total TS files          | 232     | —                  |
| Type assertions (`as`)  | 302+    | ⚠️ **HIGH**        |
| DTOs with proper typing | ~40     | ✅ **Good**        |
| `any` type usage        | Unknown | ⚠️ **Needs audit** |

**Type Assertion Analysis**:

Most `as` casts appear in:

1. **Template compilation** (Vue SFC → JS imports)
2. **MongoDB document casting** (`as CombatSessionDocument`)
3. **OpenAPI type mapping** (api-types.ts generation)
4. **Frontend API responses** (API client wrapping)

**Critical Issues**:

- ❌ **CombatActionResponseDto vs AttackResponseDto confusion** (just fixed)
- ⚠️ **Some services use implicit `any`** in return types
- ⚠️ **Mongoose query results** sometimes cast without null checks

**Recommendations**:

1. **Eliminate `as unknown as Type` patterns** - Use type guards instead:

   ```typescript
   // BAD
   const data = response as unknown as CombatActionResponseDto;

   // GOOD
   const data = ensureCombatActionResponseDto(response);
   // with type guard:
   function ensureCombatActionResponseDto(x: unknown): CombatActionResponseDto {
     if (!x || typeof x !== "object") throw new Error("Invalid response");
     // ... validate properties
     return x as CombatActionResponseDto;
   }
   ```

2. **Add strict TypeScript config**:

   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "noImplicitThis": true,
       "strictNullChecks": true,
       "strictFunctionTypes": true,
       "noImplicitReturns": true
     }
   }
   ```

3. **Use discriminated unions** for response handling:
   ```typescript
   type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };
   ```

### 4. Module Organization

**Well-Structured Modules** ✅:

- `CombatModule`: Orchestrator + AppService + DomainServices pattern
- `CharacterModule`: Clean exports (CharacterAppService, CharacterService)
- `AuthModule`: Good use of NestJS guards & strategies
- `DiceModule`: Minimal, focused module

**Improvements Needed** ⚠️:

- `ChatModule`: Circular dependency with CombatModule (uses `forwardRef`)
- `ImageModule`: Could abstract Gemini service better
- Module exports are unclear - no documentation of public API

**Recommendation**: Create `module-exports.ts` file for each module documenting what's exported:

```typescript
// modules/combat.module.ts
export * from "../orchestrators/combat/index.js";
export * from "../domain/combat/combat.app.service.js";
// Public: CombatOrchestrator, CombatAppService
// Internal: InitService, TurnOrderService, etc.
```

---

## Code Quality Assessment

### 1. Test Coverage

**Current**: ~13% (31 test files, 232 source files)

**Context**: Project is 1 month old, E2E tests are fragile and break frequently during rapid development. Focus on stability first, coverage later.

**What's Tested** ✅:

- Backend domain services (AVA in `apps/backend/test/`)
- Frontend components (Vitest in `apps/frontend/test/`)
- E2E flows (Playwright in `packages/e2e/`)

**What's Missing** ❌:

- Orchestrator integration tests
- API contract tests (OpenAPI validation)
- Edge cases in combat mechanics
- Error handling scenarios
- Frontend state management (Pinia stores)

**Recommendation**:

```bash
# Add coverage threshold
npm run test -- --coverage --threshold=70

# Priority test files to add:
- apps/backend/test/integration/combat-orchestrator.spec.ts
- apps/backend/test/integration/character-creation.spec.ts
- apps/frontend/test/stores/combatStore.spec.ts
- packages/e2e/tests/full-combat-flow.spec.ts
```

### 2. Error Handling

**Issues Found**:

- ⚠️ Inconsistent error messages (some generic, some detailed)
- ⚠️ 404 errors not always thrown (sometimes return null)
- ⚠️ Some async operations don't have error boundaries

**Example Issues**:

```typescript
// apps/backend/src/domain/spell-definition/spell-definition.service.ts:25
async findByDefinitionId(definitionId: string): Promise<SpellDefinition> {
  const result = await this.model.findOne({ definitionId }).exec();
  if (!result) throw new NotFoundException(`SpellDefinition not found: ${definitionId}`);
  return result;
}
// ✅ GOOD: Clear error

// But in other places:
async findByName(name: string): Promise<SpellDefinition | null> {
  return this.model.findOne({ name }).exec();
}
// ⚠️ INCONSISTENT: Should throw or be consistent with findByDefinitionId
```

**Recommendation**: Create error handling strategy:

```typescript
// infra/errors/index.ts
export class DomainNotFoundError extends Error {
  constructor(domain: string, identifier: string) {
    super(`${domain} not found: ${identifier}`);
    this.name = "DomainNotFoundError";
  }
}

// Usage:
if (!result) throw new DomainNotFoundError("SpellDefinition", definitionId);
```

### 3. Input Validation

**Strengths** ✅:

- DTOs use `class-validator` decorators
- Some controllers validate with `ParseIntPipe`
- Request bodies are validated via DTOs

**Gaps** ⚠️:

- Path parameters often not validated (e.g., `characterId` assumed valid)
- Query parameters missing validation
- Some controllers accept generic objects

**Recommendation**: Add `ParseUUIDPipe` for character IDs:

```typescript
@Get(':characterId')
async getCharacter(
  @Param('characterId', new ParseUUIDPipe({ version: '4' })) characterId: string
) {
  return this.characterService.findOne(characterId);
}
```

### 4. Documentation

**Strengths** ✅:

- OpenAPI/Swagger decorators in controllers
- ARCHI.md documents backend layering
- Orchestrator classes have comments explaining responsibilities

**Gaps** ⚠️:

- No API documentation (README mentions frontend: http://localhost, backend: http://localhost/api/docs)
- Combat rules not documented (action economy, opportunity attacks)
- DTO purposes unclear in many cases
- Frontend composables lack JSDoc comments

**Recommendation**:

1. Add `README.md` per major domain explaining key concepts
2. Add JSDoc comments to all public service methods
3. Create decision log for architectural choices

---

## Frontend Quality

### 1. State Management (Pinia)

**Assessment**: ✅ **GOOD**

- Uses modern Pinia store
- Clear separation of concerns (stores vs composables)
- Reactive properties properly typed

**Issues**:

- ⚠️ `combatStore.ts` mixes animation state with game state
- ⚠️ Some refs used globally (e.g., `showAttackResultModal`)

**Store Pattern Discussion**:

Two approaches exist:

1. **Multiple independent refs** (current) - Better performance, granular reactivity ✅ **Recommended for this app**
2. **Single ref object** - Simpler but all mutations trigger all watchers ❌

Current approach is correct for combat store with frequent UI updates. Consider grouping by domain:

```typescript
const gameState = ref({ roundNumber, phase, currentTurnIndex });
const combatants = ref({ player, enemies, turnOrder });
const ui = ref({ showModal, isProcessing });
```

### 2. Component Architecture

**Strengths** ✅:

- Vue 3 Composition API with TypeScript
- Clear component hierarchy
- Prop validation with types

**Gaps** ⚠️:

- Some components too large (500+ lines)
- Limited prop documentation
- No component storybook/showcase

**Recommendation**: Break large components into smaller pieces and add Storybook.

### 3. API Client

**Current Pattern**:

```typescript
// APIs generated manually
async attack(characterId, target, spellName?): Promise<CombatActionResponseDto>
```

**Issues**:

- Manual API client maintenance ~~(could use OpenAPI generator)~~ ✅ Current setup with openapi-typescript + openapi-fetch is optimal
- Limited error handling
- No retry logic

**Recommendation**: ✅ **Created `packages/api-client`** - Centralized, type-safe API client. See `packages/api-client/README.md` for usage.

---

## Security Assessment

### ✅ Strengths

- JWT authentication in place (`JwtAuthGuard`)
- Google OAuth integration
- Password hashing with bcrypt
- Request user context properly extracted

### ⚠️ Concerns

- No CSRF protection visible
- Rate limiting not evident
- No request size limits specified
- MongoDB queries should use parameterized queries (need audit)

**Recommendations**:

1. Add helmet middleware for security headers
2. Implement rate limiting per user
3. Add request validation middleware
4. Audit MongoDB queries for injection vulnerabilities

---

## Performance Considerations

### Backend

| Area              | Assessment                                 |
| ----------------- | ------------------------------------------ |
| Database queries  | ⚠️ N+1 queries possible in chat history    |
| Caching           | ❌ No caching layer                        |
| API response size | ⚠️ Some endpoints return full combat state |
| Async handling    | ✅ Proper async/await patterns             |

**Recommendations**:

1. Add Redis for caching spell definitions, class definitions
2. Implement pagination for history endpoints
3. Use GraphQL (optional) for flexible response shapes

### Frontend

| Area                  | Assessment                                         |
| --------------------- | -------------------------------------------------- |
| Bundle size           | ⚠️ Unknown (no build analysis)                     |
| Re-renders            | ⚠️ Some watchers might trigger unnecessary renders |
| Animation performance | ✅ Using CSS transitions appropriately             |
| Network requests      | ⚠️ Some requests could be batched                  |

**Recommendations**:

1. Add bundle analysis: `vite-plugin-visualizer`
2. Profile performance with Vue DevTools
3. Consider batching multiple small API calls

---

## Dependency Management

**Current**:

- Backend: NestJS, Mongoose, Google Gemini, class-validator
- Frontend: Vue 3, Pinia, Vite, Playwright
- Shared: openapi-typescript, ts-node

**Assessment**: ✅ **Well-chosen**

- No unnecessary large dependencies
- Good separation of dev vs runtime deps
- Security-focused choices (JWT, bcrypt)

**Recommendations**:

1. Add `npm audit` to CI/CD
2. Enable Dependabot for automated PRs
3. Pin major versions strictly in monorepo

---

## Recommendations (Priority Order)

### 🔴 Critical (Do First)

1. ✅ **Add architectural boundary tests** - Example created in `test/architecture/module-boundaries.spec.ts`
2. **Standardize error handling** - Create error hierarchy (defer until patterns stabilize)
3. **Eliminate `as unknown as Type`** - Keep in mind for gradual improvement
4. **Add input validation** - Use pipes for path/query params (defer, low priority)

### 🟡 High (When Ready)

1. **Increase test coverage** - Focus on stability first, E2E tests too fragile currently
2. ✅ **Document module boundaries** - Example created in `combat.module.exports.md`
3. **Add JSDoc to public methods** - Start when API stabilizes
4. **Implement error boundary in frontend** - Good for production

### 🟢 Medium (Future)

1. ✅ **Create `packages/api-client`** - Centralized type-safe client created
2. Add bundle size monitoring
3. Implement caching layer (Redis)
4. Create architecture ADRs when patterns are stable

---

## Code Metrics Summary

| Metric                | Current  | Target   | Status |
| --------------------- | -------- | -------- | ------ |
| Test Coverage         | 13%      | 70%+     | 🔴     |
| Type Assertions       | 302+     | <50      | 🔴     |
| Avg File Size         | ~200 LOC | <300 LOC | 🟡     |
| Cyclomatic Complexity | Unknown  | <10 avg  | 🟡     |
| Module Coupling       | Moderate | Low      | 🟡     |
| Documentation         | Partial  | Complete | 🟡     |

---

## Conclusion

RPG-Gen demonstrates **solid engineering practices** with good foundational architecture. The main opportunities for improvement lie in:

1. **Type Safety** - Move from runtime validation to compile-time checks
2. **Test Coverage** - Expand testing significantly for confidence
3. **Code Consistency** - Standardize error handling and validation
4. **Documentation** - Formalize architectural decisions and API contracts

The project is **well-positioned for scaling** with some targeted improvements. The orchestrator pattern and module-based structure provide good foundations for adding new features (new classes, new spell systems, new combat mechanics).

**Next Steps**:

1. Review this analysis with team
2. Create GitHub issues for critical items
3. Estimate effort for high-priority improvements
4. Schedule implementation into roadmap

---

**Analysis performed**: December 15, 2025
**Analyzed by**: GitHub Copilot Code Analysis
**Tools used**: TypeScript compiler, grep pattern matching, semantic search
