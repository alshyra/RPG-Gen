# Shared Types

Shared TypeScript types and interfaces used across RPG-Gen frontend and backend.

## Structure

- `types/character.ts` - Character, Race, Skills, SavedCharacterEntry
- `types/game.ts` - GameInstruction, ChatMessage, GameResponse, RollResult

## Usage

### Frontend

```typescript
import type { CharacterEntry, GameResponse } from "@rpg-gen/shared";

const character: CharacterEntry = {
  /* ... */
};
```

### Backend

```typescript
import type { CharacterEntry, GameInstruction } from "@rpg-gen/shared";

interface ChatRequest {
  sessionId: string;
  character: CharacterEntry;
  message: string;
}
```

## Adding Types

1. Add new type to appropriate file in `types/`
2. Export from `types/index.ts`
3. Update frontend and backend imports as needed

## Guidelines

- Use `interface` for object types (not `type`)
- Document with JSDoc comments
- Prefer single responsibility per type
- Keep types immutable (no mutable methods)
- Avoid circular dependencies between character.ts and game.ts
