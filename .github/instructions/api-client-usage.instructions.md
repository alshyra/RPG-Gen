---
applyTo: "packages/api-client/src/**/*.ts, apps/frontend/src/services/**/*.ts, apps/frontend/src/composables/**/*.ts"
---

# Frontend API Client Usage Instructions

Ce document décrit comment interagir avec l'API backend depuis le frontend en utilisant le package `api-client` et la bibliothèque `vuequery`.

**Principes Clés :**

1.  **Utilisation de `@rpg-gen/api-client` :** Toutes les interactions avec l'API backend doivent passer par le package `@rpg-gen/api-client`. Ce package encapsule les appels HTTP et gère l'authentification, les erreurs et la sérialisation/désérialisation des DTOs.
2.  **`vuequery` pour la Gestion des Données :** Utilisez `vuequery` (ou `@tanstack/vue-query`) pour toutes les opérations de récupération de données (`queries`) et de modification (`mutations`). `vuequery` offre une gestion automatique du cache, des tentatives, de la synchronisation en arrière-plan et de la gestion des erreurs.
    *   **Queries :** Utilisez `useQuery` pour les requêtes de lecture. Définissez des clés de requête claires et granulaires pour optimiser le cache. Gérez les états de chargement (`isLoading`), d'erreur (`isError`) et les données (`data`).
    *   **Mutations :** Utilisez `useMutation` pour les requêtes de création, mise à jour ou suppression de données. Gérez les états de mutation (`isLoading`, `isError`, `isSuccess`) et invalidez les caches de requêtes pertinents après une mutation réussie pour rafraîchir les données de l'UI.
3.  **DTOs Partagés (`@rpg-gen/shared`) :** Utilisez les DTOs générés du package `@rpg-gen/shared` pour typer toutes les requêtes et réponses de l'API. Cela assure une cohérence stricte entre le frontend et le backend et permet une validation automatique au niveau du type.
4.  **Gestion des Erreurs :** Implémentez une gestion centralisée des erreurs provenant de l'API. `vuequery` facilite cela via les callbacks `onError` des queries et mutations, ou via des plugins globaux.
5.  **Composables API :** Créez des `composables` Vue 3 spécifiques pour encapsuler la logique d'accès à l'API pour des entités ou des fonctionnalités spécifiques (e.g., `useCharactersApi`, `useCombatApi`). Cela rend le code plus modulaire et réutilisable.

**Exemple de Query :**

```typescript
import { useQuery } from '@tanstack/vue-query';
import { characterApi } from '@rpg-gen/api-client';
import { CharacterDto } from '@rpg-gen/shared/generated';

export function useCharacter(id: string) {
  return useQuery<CharacterDto>({
    queryKey: ['character', id],
    queryFn: () => characterApi.getCharacter(id),
    // ... autres options de vuequery
  });
}
```

**Exemple de Mutation :**

```typescript
import { useMutation, useQueryClient } from '@tanstack/vue-query';
import { characterApi } from '@rpg-gen/api-client';
import { CreateCharacterDto, CharacterDto } from '@rpg-gen/shared/generated';

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newCharacter: CreateCharacterDto) => characterApi.createCharacter(newCharacter),
    onSuccess: () => {
      // Invalider le cache de la liste des personnages pour forcer un rafraîchissement
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
    // ... autres options de mutation
  });
}
```