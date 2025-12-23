# Auth Bounded Context

Authentication and user identity management following DDD + Clean Architecture patterns.

## Architecture

### Domain Layer
- **Entities**: `AuthUser` - aggregate root with immutable design
- **Repositories**: `IUserRepository` - port defining persistence contract
- **Strategies**: Passport strategies (Google OAuth, JWT) that delegate to repositories

### Application Layer
- **Services**: `AuthAppService` - orchestrates domain logic, coordinates flows
  - loginWithGoogle: OAuth callback flow
  - validateUserByToken: JWT validation
  - getUserProfile: retrieve user data
  - logout: cleanup/token management

### Infrastructure Layer
- **Adapters**: `MongoUserRepository` - implements IUserRepository using Mongoose
- **Mappers**: `UserMapper` - transforms Mongoose Documents ↔ Domain Entities
- **Schemas**: `User` - Mongoose schema and type definitions

### API Layer
- **Controllers**: `AuthController` - REST endpoints using AuthAppService
- **DTOs**: `AuthProfileDto` - public response shapes

## Testing Strategy

All tests follow AVA convention and are located in `test/` directory mirroring source structure.

### Unit Tests
Located in `test/unit/`:
- `domain/entities/` - Entity logic, immutability, value objects
- `application/services/` - Service orchestration (with mocked repositories)
- `infrastructure/persistence/` - Mappers, adapters

Run tests:
```bash
npm test -- src/bounded-contexts/auth/test/unit/**/*.test.ts
```

### Examples

#### Testing Domain Entities
```typescript
import { AuthUser } from '../../../../domain/entities/AuthUser.js';

test('AuthUser should be immutable', t => {
  const user1 = new AuthUser({ ... });
  const user2 = user1.withUpdatedLastLogin(new Date());
  
  t.not(user1, user2); // Different instances
  t.deepEqual(user1.lastLogin, originalDate); // Original unchanged
});
```

#### Testing Application Services (with mocks)
```typescript
test('AuthAppService should use repository abstraction', async t => {
  const mockRepo = {
    findOrCreateFromGoogle: async (profile) => new AuthUser({ ... })
  };
  
  const service = new AuthAppService(mockRepo, jwtService);
  const result = await service.loginWithGoogle(googleProfile);
  
  t.truthy(result.accessToken);
});
```

## DDD Principles Applied

1. **Aggregate Root**: AuthUser encapsulates all user identity logic
2. **Entity Immutability**: State changes return new instances via factory methods
3. **Port/Adapter**: IUserRepository (port) abstracted from MongoUserRepository (adapter)
4. **Value Objects**: AuthProfile, JwtPayload as immutable data structures
5. **Bounded Context**: Auth is isolated, only exports domain aggregates and application services

## Directory Structure

```
auth/
├── domain/
│   ├── entities/
│   │   └── AuthUser.ts          # Aggregate root
│   ├── repositories/
│   │   └── IUserRepository.ts   # Port interface
│   ├── google.strategy.ts       # Passport strategy
│   ├── jwt.strategy.ts          # JWT validation strategy
│   ├── google-auth.guard.ts     # NestJS guard
│   └── jwt-auth.guard.js        # NestJS guard
├── application/
│   └── services/
│       └── AuthAppService.ts    # Orchestration service
├── infrastructure/
│   ├── User.ts                  # Mongoose schema
│   └── persistence/
│       ├── mongo/
│       │   └── MongoUserRepository.ts  # Adapter
│       └── mappers/
│           └── UserMapper.ts    # Document ↔ Entity mapping
├── api/
│   ├── controllers/
│   │   └── auth.controller.ts   # REST endpoints
│   └── dto/
│       └── AuthProfileDto.ts    # API response
├── test/
│   └── unit/
│       ├── domain/
│       └── application/
└── auth.module.ts               # NestJS module + DI configuration
```

## Integration Points

### From Other Contexts
- Character BC imports `AuthModule` for user ownership
- Chat BC uses authenticated user context
- Access guard: `@UseGuards(JwtAuthGuard)` validates token and injects `AuthUser`

### To Other Contexts
- Exports: `AuthAppService`, `AuthModule`, `JwtAuthGuard`
- Contracts: AuthUser aggregate only (no internal types leaked)

## Future Improvements

- [ ] Token blacklist/revocation mechanism
- [ ] Role-based access control (RBAC)
- [ ] Session management with refresh tokens
- [ ] Integration tests with Docker MongoDB
- [ ] OAuth provider abstraction (Facebook, GitHub, etc.)
