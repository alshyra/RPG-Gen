# Copilot Instructions for RPG-Gen Project

## Architecture Overview

### Full Stack

- **Frontend**: Vue 3 + TypeScript + Tailwind CSS + Vite (port 5173)
- **Backend**: NestJS + Gemini SDK + file-based persistence (port 3001)
- **Storage**: Frontend uses `localStorage` only; Backend stores chat history in `archives/{uuid}/history.json`

### Core Data Flow

1. **Character Creation**: User creates character → saved to localStorage with UUID → UUID becomes session ID
2. **Game Session**: Each character UUID = unique chat session ID; backend persists chat history per session
3. **Game Loop**: Player sends message → Backend (Gemini) processes with character context → Returns narrative + instructions (roll/xp/hp) → Frontend handles modals

### Key Services & Patterns

#### Frontend

- **`characterService`**: Single source of truth for character persistence (UUID-based, localStorage)
  - All characters stored in `rpg-characters` key
  - Current character tracked separately in `rpg-character-id`
  - Deceased characters archived separately
- **`gameEngine`**: Session manager (singleton) - sessionId = character.id
  - `initSession()`: Loads character + conversation history
  - `sendMessage()`: Posts to `/api/chat` with sessionId + character
- **`useCharacterCreation`**: Composable for character form state (5-step wizard)
  - Routes: `/character/:world?/step/:step` (1-based step in URL)
  - Step 0: Name + Gender
  - Step 1: Race + Class selection
  - Step 2: Ability score distribution
  - Step 3: Skill proficiencies (class-specific)
  - Step 4: Avatar generation (optional)
- **`useGameSession`**: Initialize game with character + load history
- **`useGameMessages`**: Handle chat responses + process instructions (roll/xp/hp)
- **`useGameRolls`**: Dice rolling + skill modifier calculation
- **`gameStore` (Pinia)**: Global state for messages, character, pending instructions, modals

#### Backend

- **`ChatController`**: Main API endpoint
  - `POST /api/chat`: Send message (returns narrative + instructions)
  - `GET /api/chat/history`: Load session history for character
  - Session management: Maps sessionId → character context → Gemini API
- **`ConversationService`**: Persists chat history to files
  - Escapes `\n` in messages for JSON storage/transmission
  - Maintains conversation per sessionId (per character)
- **`GameParser`**: Extracts instructions from Gemini responses
  - Preserves newlines in narrative (critical for lists/formatting)
  - Parses roll instructions: `[ROLL:dices=1d20 modifier=+5]`

## UI Component Standards

### Input Components (no raw `<input>` in feature components)

- **`UiInputText`**: Text inputs (v-model compatible)
- **`UiInputCheckbox`**: Checkboxes (`:checked` + `@change`)
- **`UiInputTextarea`**: Multiline text (v-model compatible)
- All styled with Tailwind (dark theme: `bg-slate-800`, focus: `focus:ring-indigo-600`)

### Button Components

- **`UiButton`**: Primary action button (props: `variant` = 'primary' | 'ghost')
- **`UiButtonToggle`**: Toggle selection (wraps UiButton, props: `:is-selected`)
- Used in all feature components (no raw `<button>`)

### Modal Components

- **`RollResultModal`**: Dice roll visualization with critical detection (nat 1/20)
- **`DeathModal`**: Character death flow
- Generic modal structure: title + content + action buttons

## Character & D&D Rules

### Character Structure

```typescript
interface CharacterEntry {
  id: string; // UUID
  name: string;
  race: { id: string; name: string; mods: Record<string, number> };
  scores: { Str; Dex; Con; Int; Wis; Cha }; // Racial mods applied
  hp: number; // Current
  hpMax: number; // Max from CON
  totalXp: number; // Cumulative
  classes: [{ name: string; level: number }]; // Level from XP (L1-20)
  skills: [{ name: string; proficient: boolean; modifier: number }];
  world: string; // Game universe ID (dnd/vtm/cyberpunk)
  portrait: string; // Image path or generated URL
  gender: "male" | "female";
  proficiency: number; // Bonus (default 2)
}
```

### D&D Rules Service

- **18 Skills**: Acrobatics, Animal Handling, Arcana, Athletics, Deception, History, Insight, Intimidation, Investigation, Medicine, Nature, Perception, Performance, Persuasion, Religion, Sleight of Hand, Stealth, Survival
- **Classes & Proficiencies**: Each class has 2-4 default proficiencies
- **XP Progression**: L1-20 with XP thresholds
- **Modifiers**: Ability + (Proficiency if proficient)

## Backend Chat Flow

### Message Processing

1. User sends message + sessionId + character
2. Build character summary (abilities, HP, XP, skills)
3. Load conversation history (escaped newlines preserved)
4. Call Gemini with system prompt + history + character context
5. Parse response: narrative + instructions
6. Escape `\n` in narrative for JSON transmission
7. Return: `{ text, instructions, model, usage }`

### Instructions Format

```typescript
interface GameInstruction {
  roll?: { dices: string; modifier?: number };
  xp?: number;
  hp?: number;
}
```

## Testing & Development

### Frontend

- Start: `npm run dev` (Vite, http://localhost:5173)
- Lint: `npx eslint .` (alias check)
- Proxy: `/api/*` routes to `http://localhost:3001`

### Backend

- Start: `npm run start:dev` (NestJS, port 3001)
- Tests: `npm run test` (12 tests for game-parser, all passing)
- Chat history stored in `archives/{sessionId}/history.json`

## Key Implementation Details

### Character Creation Wizard

- Route-driven step navigation: URL params control currentStep
- `currentStep` is computed (1-based in URL, 0-based internally)
- Each step is a child component: `StepBasicInfo`, `StepRaceClass`, `StepAbilityScores`, `StepSkills`, `StepAvatar`
- Form state managed by `useCharacterCreation` composable
- Props/emits pattern: step components emit updates up to wizard

### Character Death

- HP reaches 0 → triggers `DeathModal`
- Character moved to "deceased" list (separate localStorage)
- Can create new character or load previous
- Dead character data preserved with death metadata

### Newline Handling (Critical)

- Backend parser: preserve `\n` in narrative (don't use `/\s+/g`)
- ConversationService: escape `\n` to `\\n` on save, keep escaped on load
- ChatController: escape for API transmission, unescape for storage
- Result: Markdown lists render correctly in frontend

## Common Pitfalls

1. **Don't use raw `<input>`, `<button>`, `<textarea>`** → Use UI components
2. **Don't modify character state directly** → Use characterService methods
3. **Don't create new GameEngine instances** → Use singleton `gameEngine`
4. **Remember: 1-based steps in URL** → Convert to 0-based internally
5. **Escaped newlines in transmission** → Preserve in backend/frontend boundary
6. **Don't use `Object.assign()`** → Use object spread `{ ...obj, ...updates }` for clarity and immutability
7. **No service-to-service calls on frontend** → Services are data access layers; use composables for orchestration
8. **Props are for generics (especially UI)** → Business components use composables + stores instead of prop drilling
9. **URL only stores essential info** → `/character/:world?/step/:step` (not full form state); derive rest from composables
10. **DRY principle strictly enforced** → Search existing code before creating new implementations; reuse existing patterns

## Architectural Principles

### Props Usage

- **UI Components** (`UiButton`, `UiInput*`): Heavy props usage for customization (variant, disabled, size, etc.)
- **Business Components** (`StepBasicInfo`, `RollResultModal`): Minimal props; prefer composables + stores for state
- Props = generalization; fewer props = more specific, business-focused component

### Service Layer Rules

- **Frontend Services** are **data access only** (characterService = localStorage interface, gameEngine = API interface)
- **No service calling service** - Use composables to orchestrate service calls
- Example: `useCharacterCreation` calls both `characterService` and `DnDRulesService`, not services calling each other

### URL Philosophy

- Only store state that matters for **deep linking** or **browser history**
- `/character/dnd/step/1` ✅ (user bookmarks character creation at step 1)
- `/game?messages=...&hp=...` ❌ (use store instead)
- Computed properties in components derive state from URL params

### State Management Hierarchy

1. **URL params** - Critical navigation state (step, world, character ID)
2. **Pinia store** - Global UI state (messages, modals, pending instructions)
3. **localStorage** - Persisted data (characters, deceased characters)
4. **Component refs** - Temporary form state (during character creation)

### Code Reuse Strategy

- **Before writing new code**: Search for existing implementations with semantic_search or grep_search
- **Composables are composable**: Combine smaller ones into larger ones (`useCharacterCreation` reuses `useCharacterCreationForm` patterns)
- **Extract patterns to services**: If logic appears in 2+ places, move to service or composable
- **Example**: Gender selector button pattern → `UiButtonToggle` → reused in `StepBasicInfo`

## File Organization

```
frontend/src/
├── components/
│   ├── ui/                    # Reusable UI components (UiButton*, UiInput*)
│   ├── character-creation/    # Wizard + step components
│   ├── character-stats/       # AbilityScores, SkillsPanel
│   ├── game/                  # RollResultModal, DeathModal
│   └── layout/                # ChatBar, HeaderBar
├── composables/               # useCharacterCreation, useGameSession, useGameMessages, useGameRolls
├── services/                  # characterService, gameEngine, dndRulesService
├── stores/                    # gameStore (Pinia)
└── views/                     # HomeView, GameView, CharacterCreatorView

backend/src/
├── chat/                      # ChatController, ConversationService
├── external/                  # GeminiTextService, GameParser
└── test/                      # game-parser.test.ts (12 tests passing)
```

## Example: Adding a New Character Feature

1. Create typed UI component: `UiInputXyz.vue`
2. Add form state to `useCharacterCreation` composable
3. Create feature step component: `StepXyz.vue` (follow pattern)
4. Update `CharacterCreatorWizard.vue` template + import
5. Update D&D rules in `dndRulesService` if needed
6. Update character save/load in `characterService`

---

**Last Updated**: Nov 13, 2025 | **Contributors**: Initial generation from codebase analysis
