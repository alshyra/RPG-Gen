# Types Regeneration Workflow

Ce document explique comment régénérer les types TypeScript partagés entre backend et frontend.

## Context

Le projet utilise une architecture de monorepo avec DTOs partagés:

- **Backend** (`apps/backend`): NestJS, définit les DTOs et expose un endpoint OpenAPI
- **Shared** (`packages/shared`): Types générés automatiquement depuis OpenAPI
- **Frontend** (`apps/frontend`): Vue 3, importe les types du shared

Le workflow de régénération des types assure que:

1. Les types frontend restent toujours en sync avec les endpoints backend
2. Les changements de DTO backend se propagent automatiquement au frontend
3. Les types sont générés depuis la specification OpenAPI (source de vérité)

## When to Regenerate Types

Régénérez les types dans ces cas:

1. **Après avoir modifié des DTOs backend** (ajout/suppression/modification de propriétés)
2. **Après avoir ajouté/modifié un endpoint** dans un controller
3. **Après avoir changé des réponses d'API** (structure ou status codes)
4. **En cas d'incompatibilité frontend** ("Type X has no exported member Y")

## Step-by-Step Workflow

### 1. Fix Backend Build Errors

D'abord, assurez-vous que le backend compile sans erreurs:

```bash
cd apps/backend
npm run type-check
```

Corrigez tous les erreurs TypeScript.

### 2. Start Backend

Démarrez le backend pour exposer l'endpoint OpenAPI:

```bash
# Option A: With Docker Compose (recommended for full stack)
docker compose -f compose.dev.yml up -d backend

# Option B: Direct Node
cd apps/backend
npm run start
```

Le backend doit être accessible sur `http://localhost:3001/docs-json`.

### 3. Generate OpenAPI Types

Une fois le backend running, générez les types:

```bash
cd apps/backend
npm run generate:openapi
```

This will:

- Fetch the OpenAPI spec from `http://localhost:3001/docs-json`
- Generate TypeScript types in `packages/shared/src/api-types.ts`
- Update `packages/shared/src/index.ts` with type aliases for easy importing

### 4. Update Frontend Imports

Le frontend doit utiliser les types générés:

```typescript
// Good - use types from shared
import type { CombatActionResponseDto, CombatantDto } from "@rpg-gen/shared";

// Bad - don't import from backend internal paths
import type { CombatActionResponseDto } from "@rpg-gen/backend/src/domain/combat/dto";
```

### 5. Verify No Type Errors

Check for compilation errors:

```bash
# Run type check on all packages
npm run type-check

# Or run specific package checks
cd apps/frontend && npm run type-check
cd apps/backend && npm run type-check
```

## Troubleshooting

### Backend won't start

Check logs:

```bash
docker compose -f compose.dev.yml logs backend
# or if running directly:
npm run start 2>&1 | grep -i error
```

### OpenAPI endpoint not responding

```bash
# Test connectivity
curl http://localhost:3001/docs-json | jq '.info.title'

# Wait for backend startup
sleep 10 && curl http://localhost:3001/docs-json > /dev/null && echo "Ready!"
```

### Type generation failed

```bash
# Verify the script exists and is executable
cat apps/backend/src/scripts/generate-openapi-types.ts

# Try with explicit URL
OPENAPI_URL=http://localhost:3001/docs-json npm run generate:openapi
```

### Frontend imports not found

After regeneration:

1. Verify the type is exported in `packages/shared/src/index.ts`
2. Clear node modules and reinstall: `npm ci`
3. Restart your IDE/editor TypeScript server

## Backend DTO Structure

DTOs are defined in `apps/backend/src/domain/*/dto/`:

```
apps/backend/src/domain/
├── combat/
│   ├── dto/
│   │   ├── CombatActionResponseDto.ts
│   │   ├── CombatantDto.ts
│   │   ├── CombatStateDto.ts
│   │   └── ...
│   └── ...
├── character/
│   ├── dto/
│   │   ├── CharacterResponseDto.ts
│   │   └── ...
│   └── ...
└── ...
```

Each DTO is decorated with `@ApiProperty()` for OpenAPI documentation.

## Important Notes

- **Never edit** `packages/shared/src/api-types.ts` or `packages/shared/src/index.ts` manually - they are auto-generated
- If you need to add backend-only types (not exposed via API), put them in `apps/backend` and don't try to share them
- For each DTO change, follow the full workflow to ensure frontend stays in sync
- The OpenAPI generation is the source of truth - always regenerate after backend changes

## CI/CD Integration

In GitHub Actions (`.github/workflows/qa-checks.yml`):

```yaml
- name: Generate OpenAPI types
  run: |
    docker compose -f compose.dev.yml up -d backend
    sleep 30  # Wait for backend startup
    npm --workspace @rpg-gen/backend run generate:openapi
```

Types are committed to version control so frontend doesn't need to regenerate locally in CI.
