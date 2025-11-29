Turn-based combat REST API strategy

Overview

- The combat loop is built around strict phases and single-responsibility endpoints so controllers remain explicit about accepted shapes.
- Client holds UI state; server is authoritative for combat resolution and returns canonical state after each step.

Phases (high level)

1. Init: Player arrives, client requests initial combat state.
2. Player Turn:
   a. Select Action (attack / spell / item)
   b. Server resolves action initiation (attack roll) and returns whether a damage roll is needed
   c. Client performs damage roll (client-side dice UI or remote roll endpoint) and submits result
   d. Server applies damage, updates state, and evaluates deaths
3. Enemy Turns:
   - Server processes enemy AI actions sequentially or atomically, applies damage, updates state
4. End Turn:
   - Server returns new combat state and next player prompt if combat continues
5. Resolve End:
   - Victory or defeat state returned and combat session archived

Recommended REST endpoints and flow

- GET /api/combat/:characterId/status

  - Purpose: Fetch current canonical combat state.
  - NOTE: Response MUST conform to the shared DTO CombatStateDto (packages/shared). Use the generated DTO types on both backend controllers and frontend clients.
  - Response example: use CombatStateDto (see packages/shared/src/openapi.json -> CombatStateDto)

- POST /api/combat/:characterId/action

  - Purpose: Player submits chosen action.
  - Controller must accept a single strict DTO shape. Reuse shared AttackRequestDto / other specific request DTOs where applicable (e.g. AttackRequestDto for basic attacks).
  - Body example: follow AttackRequestDto (property "target")
  - Server response when an attack roll is required: return a structure fitting TurnResultWithInstructionsDto or a minimal instructions array referencing RollInstructionMessageDto and DiceThrowDto.

- POST /api/roll

  - Purpose: Central dice roll service (optional).
  - Request/response should align with DiceRequest / DiceThrowDto from shared OpenAPI.

- POST /api/combat/:characterId/damage (or /api/combat/:characterId/resolve-roll)
  - Purpose: Submit damage roll result for the pending hit.
  - Use DiceThrowDto (or a small wrapper DTO) and return TurnResultWithInstructionsDto (shared) containing applied changes.

Server resolution order (attack example)

1. Receive action POST /action (attack).
2. Validate payload against a strict DTO (no multiple shapes).
3. Compute attack roll (server or client-provided roll depending on rules).
4. Compare roll to target AC:
   - Miss => immediately apply miss effects (e.g., status, messaging) and proceed to enemy turns.
   - Hit => instruct client to roll damage (server may supply damage expression).
5. Receive damage via /damage, validate damage value with expected expression range if required.
6. Apply damage to target HP, check for death/overkill.
7. If player remains alive and enemies remain, process enemy turns on server:
   - For each enemy in turn order: decide action via AI service, resolve the same way (attack → damage → apply).
8. Return final state at the end of the turn (or intermediate prompts if additional player input required).

- When returning intermediate instructions or required client rolls, use RollInstructionMessageDto and DiceThrowDto shapes from shared DTOs to avoid duplication.

State and DTO guidance

- CombatStateDto (server authoritative) must be the canonical shape returned by status endpoints. Do not invent new, divergent state shapes.
- Reuse existing shared DTOs from packages/shared/src/openapi.json:
  - CombatStateDto, CombatStartRequestDto, AttackRequestDto, DiceRequest, DiceThrowDto, TurnResultWithInstructionsDto, CombatEndResponseDto, RollInstructionMessageDto, etc.
- DTO generation: update schemas in backend and then run the generator script (packages/backend/src/scripts/generate-dtos.ts) to refresh packages/shared/src/generated. Do NOT hand-edit generated files in packages/shared.
- Controllers must be strict and explicit about request shapes and validate against the shared DTO classes/interfaces (NestJS pipes). Do NOT accept multiple ambiguous payload shapes in a single controller method.

Edge cases and concurrency

- Concurrent submissions: reject with 409 conflict if activeActorId doesn't match requester or if phase mismatches.
- Latency/retries: include requestId and idempotency keys for action submissions.
- Simultaneous deaths: define tie-breaker (e.g., resolve by initiative then actorId).
- Validation failures: return 400 with specific error codes (INVALID_TARGET, NOT_YOUR_TURN, STALE_STATE).
- On 409/410 or recovery endpoints return objects that match shared response DTOs (e.g. TurnResultWithInstructionsDto or a small ActionStatusDto you add to shared schemas).

Client responsibilities

- Poll initial state on mount: GET /api/combat/:characterId/status.
- When prompted, submit single well-formed action payload to /action.
- If server requests a damage roll, use /api/roll OR a local UI to get a number, then POST /damage.
- Display server-provided messages and dice breakdown for auditing.

Logging & testability

- Log events and persist action records referencing DTO types/names for easier mapping in tests.
- Add unit tests asserting controllers accept only the shared DTO shapes and that serialized results conform to TurnResultWithInstructionsDto.
- If DTO changes are necessary: modify backend schema → run generator → commit generated shared DTOs and update controllers/clients.

Notes

- Keep controllers strict and single-shaped. Use the shared DTOs rather than duplicating schema definitions.
- Prefer server-side deterministic checks for critical rolls or verify client rolls against server seeds using DiceThrowDto semantics.
- Document which shared DTOs are used by each endpoint in controller JSDoc/comments to keep frontend/backed teams aligned.

Idempotence et flux d'action — décision unique (pas de choix)

- Décision générale (obligatoire) :

  - Utiliser systématiquement un actionToken consommable émis par le serveur dans la prompt (actionToken: "t-uuid") combiné à un Idempotency-Key optionnel en header. Toute action modifiant l'état doit utiliser le même actionToken pour l'ensemble de la séquence multi-étapes (ex. attack → resolve-roll).
  - Le serveur persiste une ActionRecord { actionToken, idempotencyKey, requesterId, status, resultPayload, createdAt, updatedAt }.
  - Première requête avec actionToken non consommé : traitement atomique, persist le résultat final (TurnResultWithInstructionsDto) et retourne 200 + payload.
  - Requêtes ultérieures avec le même actionToken : retourner 200 + le résultat historique (idempotence garantie côté serveur). Ne pas retourner 409 pour duplicata réessayé ; 409 reste réservé aux conflits de phase/acteur.
  - Si actionToken est invalide ou consommé par une autre entité (mismatch requesterId) : retourner 409 CONFLICT.
  - Si token expiré/consommé de façon irréversible et non récupérable : retourner 410 GONE.

- Endpoints et conventions (contrac t strict) :

  - Prompt envoyé au client inclut: { phase: "PLAYER_TURN", actionToken: "t-uuid", expectedDto: "AttackRequestDto", validTargets: [...] }.
  - Attack: POST /api/combat/:combatId/attack/:actionToken
    - Body must conform to AttackRequestDto (shared).
    - Behavior: atomically insert/find ActionRecord by actionToken; if first time → process → persist result as TurnResultWithInstructionsDto → return 200 with result.
  - Resolve roll / damage: POST /api/combat/:combatId/resolve-roll/:actionToken
    - Body must conform to DiceThrowDto (shared) or wrapper validated DTO.
    - Same consumption semantics: uses same actionToken and returns stored result after applying effects.
  - Status: GET /api/combat/:characterId/status returns CombatStateDto.

- Duplicate & conflit :
  - Duplicate using same actionToken => return stored TurnResultWithInstructionsDto (200).
  - Submission without matching activeActorId/phase => 409 CONFLICT with error code NOT_YOUR_TURN.
  - Invalid target or DTO validation => 400 with error code INVALID_TARGET.
  - Token consumed by other requesterId => 409 CONFLICT with context.
  - Token expired/irrecoverable => 410 GONE.

Raisons et avantages (brève)

- Garantie exactly-once pour l'utilisateur sans lui imposer logique de retry compliquée.
- Facile à auditer : ActionRecord stocke resultPayload et idempotencyKey.
- Frontend peut réessayer librement en cas de réseau instable et recevra toujours le même résultat final.
- Conserve la règle du repo : controllers stricts, DTOs partagés, pas d'unions ambiguës.

Checklist d'implémentation (backend)

1. Ajouter modèle/collection ActionRecord:
   - fields: actionToken (unique), idempotencyKey, requesterId, combatId, expectedDto, status (PENDING|APPLIED|FAILED), resultPayload (TurnResultWithInstructionsDto), createdAt, updatedAt, expiresAt.
2. Endpoint handlers:
   - Atomically upsert/find ActionRecord by actionToken (et optionally idempotencyKey).
   - Si status PENDING, verrou transactionnel → traiter → set APPLIED + resultPayload.
   - Si existing APPLIED → return stored result.
3. Validation:
   - Controllers accept only shared DTOs (AttackRequestDto, DiceThrowDto, etc.) validated via NestJS pipes.
   - Reject mismatched activeActorId/phase with 409 before consuming token.
4. Tests:
   - Duplicate submission returns same result (200).
   - Conflict when actor mismatch (409).
   - Full sequence attack → resolve-roll using same token applies exactly-once.
   - Simultaneous submissions resolved via DB atomic upsert produce single APPLIED result.
5. Migration / infra:
   - DB unique index on actionToken.
   - TTL on expiresAt to garbage-collect old action records.
6. Docs:
   - Prompt must include expectedDto name and actionToken.
   - Client guidance: reuse actionToken across the multi-step flow.

Status of implementation (backend changes applied)

- **Implemented**: `ActionRecord` Mongoose schema and indexes added in `packages/backend/src/combat/action-record.schema.ts`.
- **Implemented**: `ActionRecordService` in `packages/backend/src/combat/action-record.service.ts` to provide atomic acquire/setApplied/setFailed semantics.
- **Implemented**: New `generateToken()` method in `ActionRecordService` to create action tokens for player turns.
- **Implemented**: New idempotent endpoints:
  - `POST /api/combat/:characterId/attack/:actionToken` (uses `AttackRequestDto`) — implemented in `packages/backend/src/combat/combat.controller.ts`.
  - `POST /api/combat/:characterId/resolve-roll/:actionToken` (uses dice resolution payload) — implemented in `packages/backend/src/combat/combat.controller.ts`.
- **Index / TTL**: unique index on `actionToken` and TTL index on `expiresAt` added to schema.
- **Implemented**: `CombatStateDto` extended with `phase`, `actionToken`, and `expectedDto` fields.
- **Implemented**: Combat start and status endpoints now generate and return `actionToken` for player actions.
- **Implemented**: Frontend `combatService` updated with `attackWithToken()` and `resolveRollWithToken()` methods.
- **Implemented**: Frontend `combatStore` now tracks `actionToken`, `phase`, and `expectedDto`.
- **Implemented**: `useCombat` composable uses action tokens when executing attacks.

Dead code removed / deprecated

- The prior non-tokenized `POST /api/combat/:characterId/attack` and `POST /api/combat/:characterId/resolve-roll` handlers were replaced by tokenized routes to enforce idempotence and server-side action records. Controller now persists and returns stored results for repeated actionToken submissions.

Notes / next steps

- Add more unit/integration tests simulating concurrent submissions (recommended using an in-memory MongoDB or test container).
- Consider adding optional `Idempotency-Key` header handling in controllers and persisting it on `ActionRecord`.
- Regenerate shared DTOs after running the backend to ensure frontend has latest types.

Mapping DTOs (rapide)

- GET status: CombatStateDto
- POST attack/:actionToken: AttackRequestDto -> TurnResultWithInstructionsDto
- POST resolve-roll/:actionToken: DiceThrowDto -> TurnResultWithInstructionsDto
- POST dice: DiceRequest -> DiceThrowDto
