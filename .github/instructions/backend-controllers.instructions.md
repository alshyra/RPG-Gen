---
applyTo: "apps/backend/src/controllers/**/*.controller.ts"
---

# Backend Controllers Instructions

Ce document détaille les règles pour créer et maintenir les controllers NestJS du backend.

## Règles essentielles

### 1. Documentation OpenAPI obligatoire

**Tous les endpoints doivent avoir une documentation OpenAPI complète** pour générer correctement les types dans `packages/shared/src/api-types.ts`.

**Décorateurs requis :**

- `@ApiTags('resource-name')` - sur la classe controller
- `@ApiOperation({ summary: "..." })` - sur chaque méthode
- `@ApiResponse({ status: 200, description: "...", type: DtoClass })` - **OBLIGATOIRE** pour tous les endpoints qui retournent des données

**Exemple correct :**

```typescript
import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { MyResponseDto } from "../domain/my-module/dto/MyResponseDto.js";

@ApiTags("my-resource")
@Controller("my-resource")
export class MyResourceController {
  @Get()
  @ApiOperation({ summary: "Get all resources" })
  @ApiResponse({ status: 200, description: "List of resources", type: [MyResponseDto] })
  async getAll(): Promise<MyResponseDto[]> {
    // ...
  }

  @Get(":id")
  @ApiOperation({ summary: "Get resource by ID" })
  @ApiResponse({ status: 200, description: "Resource found", type: MyResponseDto })
  @ApiResponse({ status: 404, description: "Resource not found" })
  async getOne(@Param("id") id: string): Promise<MyResponseDto> {
    // ...
  }
}
```

**❌ INCORRECT (manque @ApiResponse) :**

```typescript
@Get()
@ApiOperation({ summary: "Get all resources" })
async getAll(): Promise<MyResponseDto[]> {
  // Sans @ApiResponse, api-types.ts génèrera "content?: never"
}
```

### 2. Types de réponse pour les tableaux

Pour retourner un tableau, utilisez `type: [DtoClass]` avec les crochets :

```typescript
@ApiResponse({ status: 200, description: "List", type: [MyDto] })
```

### 3. Vérification après création/modification

Après avoir créé ou modifié un controller :

1. Régénérer les types OpenAPI :
   ```bash
   npm --workspace @rpg-gen/backend run generate:dtos
   ```

2. Vérifier dans `packages/shared/src/api-types.ts` que le endpoint a bien un `content` avec le DTO :
   ```typescript
   responses: {
     200: {
       content: {
         "application/json": components["schemas"]["MyResponseDto"];
       };
     };
   };
   ```

3. Si `content?: never` apparaît, c'est que le `@ApiResponse` manque ou est mal configuré.

### 4. Validation des requêtes

- Utiliser des DTOs de validation pour tous les `@Body()`, `@Query()`, `@Param()`
- Décorer ces DTOs avec `class-validator` (`@IsString()`, `@IsNumber()`, etc.)
- Ajouter `@ApiBody()` ou `@ApiQuery()` si nécessaire pour la documentation

### 5. Gestion des erreurs

Documenter tous les codes d'erreur possibles :

```typescript
@ApiResponse({ status: 400, description: "Invalid request" })
@ApiResponse({ status: 404, description: "Resource not found" })
@ApiResponse({ status: 500, description: "Internal error" })
```

## Patterns à suivre

### Controller simple (CRUD)

```typescript
@ApiTags("items")
@Controller("items")
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get()
  @ApiOperation({ summary: "List all items" })
  @ApiResponse({ status: 200, description: "Items list", type: [ItemDto] })
  async findAll(): Promise<ItemDto[]> {
    return this.itemService.findAll();
  }

  @Post()
  @ApiOperation({ summary: "Create item" })
  @ApiResponse({ status: 201, description: "Item created", type: ItemDto })
  @ApiResponse({ status: 400, description: "Invalid data" })
  async create(@Body() dto: CreateItemDto): Promise<ItemDto> {
    return this.itemService.create(dto);
  }
}
```

### Controller avec paramètres de route

```typescript
@Get(":characterId/items/:itemId")
@ApiOperation({ summary: "Get character's item" })
@ApiResponse({ status: 200, description: "Item found", type: ItemDto })
@ApiResponse({ status: 404, description: "Character or item not found" })
async getItem(
  @Param("characterId") characterId: string,
  @Param("itemId") itemId: string,
): Promise<ItemDto> {
  return this.itemService.getItem(characterId, itemId);
}
```

## Anti-patterns à éviter

❌ **Pas de @ApiResponse**
❌ **Type de retour non documenté**
❌ **Validation manquante sur les inputs**
❌ **Codes d'erreur non documentés**
❌ **Controller sans @ApiTags**

## Checklist création d'un nouveau controller

- [ ] `@ApiTags()` sur la classe
- [ ] `@ApiOperation()` sur chaque méthode
- [ ] `@ApiResponse()` pour chaque code de statut retourné
- [ ] `type: DtoClass` (ou `[DtoClass]` pour tableaux) dans @ApiResponse
- [ ] DTOs de validation pour tous les inputs
- [ ] Tests unitaires pour le controller
- [ ] Régénération des types OpenAPI
- [ ] Vérification de `api-types.ts` généré

## Ressources

- Documentation NestJS OpenAPI : https://docs.nestjs.com/openapi/introduction
- Voir autres controllers : `apps/backend/src/controllers/`
- DTOs générés : `packages/shared/src/api-types.ts`
