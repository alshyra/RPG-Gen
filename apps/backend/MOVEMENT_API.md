# Combat Grid Movement - Frontend Integration Guide

## Overview

The backend supports grid-based combat movement with automatic opportunity attack (OA) resolution. Movement is controlled by an **action-first design**: players must declare actions (Dash, Disengage) before moving, and these actions set turn effects that influence subsequent movement.

## Action-First Workflow

1. **Player declares action** → POST `/api/combat/:characterId/action` with `{actionType: 'dash'}` or `{actionType: 'disengage'}`
2. **Action sets effects** → Backend stores `activeEffects: ['dashed']` or `['disengaged']` in combat state
3. **Player moves** → POST `/api/combat/:characterId/move` with path
4. **Movement reads effects** → Backend checks activeEffects to determine movement range and OA behavior
5. **Turn ends** → activeEffects are cleared

## Backend API

### POST /api/combat/:characterId/action

Execute a combat action (attack, dash, disengage, spell, class feature).

**Request Body:**

```typescript
{
  actionType: 'attack' | 'dash' | 'disengage' | 'cast-spell' | 'second-wind' | ...;
  targetId?: string;        // Required for 'attack'
  spellName?: string;       // Required for 'cast-spell'
  featureId?: string;       // For class features
}
```

**Response:**

```typescript
{
  success: boolean;
  cost: 'ACTION' | 'BONUS_ACTION' | 'REACTION' | 'FREE';
  damage?: number;          // Damage dealt
  healing?: number;         // HP restored
  description: string;
  actionsRemaining: number;
  bonusActionsRemaining: number;
  activeEffects: string[];  // e.g., ['dashed'], ['disengaged']
  errorMessage?: string;    // If success = false
}
```

**Action Effects:**

- `dash`: Sets `activeEffects: ['dashed']` → doubles movement speed for this turn
- `disengage`: Sets `activeEffects: ['disengaged']` → prevents opportunity attacks for this turn

### POST /api/combat/:characterId/move

Execute a movement on the combat grid. Reads active effects from combat state to determine movement range and OA triggers.

**Request Body:**

```typescript
{
  combatantId: string; // ID of the unit to move
  path: Array<{ x: number; y: number }>; // Ordered list of grid positions
  // Note: movementType is no longer accepted - it's determined by prior actions
}
```

**Response:**

```typescript
{
  success: boolean;
  finalPosition: {x: number, y: number};
  events: Array<{
    type: 'move' | 'opportunity-attack' | 'reaction' | 'movement-interrupted';
    actorId: string;
    targetId?: string;
    damage?: number;
    description?: string;
  }>;
  pm: number;  // Remaining movement points
  errorMessage?: string;  // If success = false
}
```

## Frontend Responsibilities

### 1. Path Finding & Validation (Client-Side)

The frontend should:

- Implement A\* or similar pathfinding for UI/UX
- Show preview of path with estimated OA triggers (visual feedback)
- Display movement cost/range to the player (double if 'dashed' effect is active)
- Allow player to draw/select path interactively

**Important:** The backend will always re-validate the path server-side. Client-side validation is for UX only.

### 2. Action UI

Before allowing movement, provide UI for combat actions:

- **Action buttons**: Attack, Dash, Cast Spell, Use Feature
- **Bonus Action buttons**: Disengage, Second Wind, Cunning Action
- **Feedback**: Show action/bonus action economy (e.g., "1 action, 1 bonus action remaining")
- **Effect indicators**: Display active effects like "Dashed (2x movement)" or "Disengaged (no OAs)"

### 3. Grid State Management

The frontend should:

- Maintain grid dimensions (typically from combat initialization)
- Track combatant positions (updated via movement response)
- Render units at their current positions
- Update positions after successful movement
- Display activeEffects visually (icon/badge on player token)

### 4. Opportunity Attack Visualization

When receiving movement events:

1. Parse the `events` array in order
2. For each `opportunity-attack` event:
   - Animate the attack (actor → target)
   - Apply damage
   - Play sound/visual effect
3. Update final position after all events resolve

## Backend Validation Rules

The backend enforces:

- **Adjacency**: Each step must be to an adjacent tile (including diagonal)
- **Bounds checking**: All positions must be within grid (0 ≤ x < width, 0 ≤ y < height)
- **Occupancy**: Cannot move through tiles occupied by other units (except final destination)
- **Movement range**: Path length must not exceed available movement speed (doubled if 'dashed' effect is active)
- **OA triggers**: Automatically detects when leaving hostile reach and resolves attacks (skipped if 'disengaged' effect is active)
- **Action economy**: Validates actions/bonus actions are available before execution

## Example Usage

### 1. Dash Action + Movement

```typescript
// Step 1: Player uses Action to Dash
POST /api/combat/:characterId/action
{
  actionType: 'dash'
}

// Response:
{
  success: true,
  cost: 'ACTION',
  description: 'You take the Dash action, doubling your movement speed for this turn',
  actionsRemaining: 0,
  bonusActionsRemaining: 1,
  activeEffects: ['dashed']
}

// Step 2: Player moves with doubled speed
POST /api/combat/:characterId/move
{
  combatantId: "player-1",
  path: [
    {x: 5, y: 5},  // start
    {x: 5, y: 6},
    {x: 5, y: 7},
    {x: 5, y: 8},
    {x: 5, y: 9},
    {x: 5, y: 10}  // end - 5 tiles moved (with dash, speed 30 allows 60 tiles)
  ]
}

// Response:
{
  success: true,
  finalPosition: {x: 5, y: 10},
  events: [
    {type: 'move', actorId: 'player-1', description: 'Moved to (5, 10)'}
  ],
  pm: 55  // 60 - 5 tiles moved
}
```

### 2. Disengage + Movement (No OAs)

```typescript
// Step 1: Player uses Bonus Action to Disengage
POST /api/combat/:characterId/action
{
  actionType: 'disengage'
}

// Response:
{
  success: true,
  cost: 'BONUS_ACTION',
  description: 'You disengage, avoiding opportunity attacks for this turn',
  actionsRemaining: 1,
  bonusActionsRemaining: 0,
  activeEffects: ['disengaged']
}

// Step 2: Player moves through hostile reach without triggering OAs
POST /api/combat/:characterId/move
{
  combatantId: "player-1",
  path: [
    {x: 5, y: 5},
    {x: 4, y: 5},  // leaving enemy reach
    {x: 3, y: 5}
  ]
}

// Response:
{
  success: true,
  finalPosition: {x: 3, y: 5},
  events: [
    {type: 'move', actorId: 'player-1', description: 'Moved to (3, 5)'}
    // No OA events due to 'disengaged' effect
  ],
  pm: 28
}
```

### 3. Basic Movement (No Prior Action)

```typescript
// Player moves without using Dash or Disengage
POST /api/combat/:characterId/move
{
  combatantId: "player-1",
  path: [
    {x: 5, y: 5},  // current position
    {x: 5, y: 6},
    {x: 5, y: 7}
  ]
}

// Backend responds:
{
  success: true,
  finalPosition: {x: 5, y: 7},
  events: [
    {
      type: "opportunity-attack",
      actorId: "enemy-1",
      targetId: "player-1",
      damage: 6,
      description: "Enemy-1 makes an opportunity attack against Player-1"
    },
    {type: "move", actorId: "player-1", description: "Moved to (5, 7)"}
  ],
  pm: 28  // 30 - 2 tiles moved
}
```

## Grid Initialization

The backend maintains in-memory grid state per combat session. Grid must be initialized before movement (typically during combat start):

```typescript
// Backend internal (not exposed via API yet):
gridService.initializeGrid(combatId, width, height, [
  { id: 'player-1', position: { x: 5, y: 5 }, reach: 1, speed: 30, isHostile: false },
  { id: 'enemy-1', position: { x: 3, y: 3 }, reach: 1, speed: 30, isHostile: true },
]);
```

**Note:** Grid initialization will be added to the combat start endpoint in a future update.

## Error Handling

If `success: false`, check `errorMessage` for details:

**Movement errors:**

- "Movement exceeds available speed"
- "Non-adjacent move at step N"
- "Position out of bounds at step N"
- "Tile occupied at step N"
- "Combat session not found"
- "Combatant not found"

**Action errors:**

- "No actions remaining"
- "No bonus actions remaining"
- "Target ID required for attack"
- "Target not found"

Display the error to the player and allow them to retry.

## Turn Management

**Important:** `activeEffects` are turn-scoped and should be cleared when the player's turn ends. The frontend should:

1. Track when player ends their turn
2. Call the turn end endpoint (e.g., POST `/api/combat/:characterId/end-turn`)
3. Clear any UI indicators for active effects

The backend will automatically clear `activeEffects` when advancing to the next turn.

## Future Enhancements

- Terrain cost modifiers (difficult terrain, water, etc.)
- Flying/swimming movement types
- Forced movement (push/pull effects)
- Teleportation (no path, no OAs)
- Movement interrupts (e.g., OA with Sentinel feat stops movement)
- Grid state persistence in database
