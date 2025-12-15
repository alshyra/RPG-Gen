# @rpg-gen/api-client

Type-safe API client for RPG-Gen backend, using openapi-fetch and generated types.

## Installation

This is an internal package in the monorepo. It's automatically linked.

```bash
npm install  # from monorepo root
```

## Usage

### Basic Client

```typescript
import { apiClient, getData } from "@rpg-gen/api-client";

// Make a request
const response = await apiClient.GET("/api/characters");
const characters = getData(response);
```

### Authenticated Requests

```typescript
import { createAuthenticatedClient, getData } from "@rpg-gen/api-client";

const token = "your-jwt-token";
const client = createAuthenticatedClient(token);

const response = await client.POST("/api/characters", {
  body: { world: "dnd" },
});

const character = getData(response);
```

### Error Handling

```typescript
import { apiClient } from "@rpg-gen/api-client";

const response = await apiClient.GET("/api/characters/{characterId}", {
  params: { path: { characterId: "123" } },
});

if (response.error) {
  console.error("API error:", response.error);
  // Handle error (e.g., show toast)
} else {
  console.log("Character:", response.data);
}
```

### With getData Helper

```typescript
import { apiClient, getData } from "@rpg-gen/api-client";

try {
  const response = await apiClient.GET("/api/characters/{characterId}", {
    params: { path: { characterId: "123" } },
  });
  const character = getData(response); // Throws if error
  console.log(character);
} catch (error) {
  console.error("Failed to fetch character:", error);
}
```

## Benefits

✅ **Type-safe**: All endpoints and payloads are typed from OpenAPI spec
✅ **Centralized**: One place to configure API client
✅ **Reusable**: Use in frontend, tests, or other packages
✅ **Tree-shakeable**: Only imports what you use

## Migration from apps/frontend/src/apis/

Before:

```typescript
// apps/frontend/src/apis/combatApi.ts
import { api } from "./apiClient";

const response = await api.POST("/api/combat/{characterId}/action", {
  params: { path: { characterId } },
  body: requestBody,
});
```

After:

```typescript
// apps/frontend/src/apis/combatApi.ts
import { apiClient } from "@rpg-gen/api-client";

const response = await apiClient.POST("/api/combat/{characterId}/action", {
  params: { path: { characterId } },
  body: requestBody,
});
```

You can keep your domain-specific API wrappers (like `combatApi.ts`) but use the shared client underneath.
