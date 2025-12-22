---
applyTo: "apps/backend/src/scripts/generate-dtos.ts, packages/shared/src/generated/**/*.ts"
---

# DTO Generation Instructions

Ce document détaille les règles et le processus de génération des Data Transfer Objects (DTOs) partagés entre le frontend et le backend.

**Règles essentielles :**

1.  **Ne jamais éditer manuellement** les fichiers situés dans `packages/shared/src/generated`. Ces fichiers sont automatiquement générés et toute modification manuelle sera écrasée lors de la prochaine génération.
2.  Les DTOs sont générés à partir des schémas définis dans le backend.
3.  Pour mettre à jour les DTOs suite à des changements de schéma dans le backend, utilisez la commande suivante à la racine du monorepo :
    ```bash
    npm --workspace @rpg-gen/backend run generate:dtos
    ```
4.  **Vérifiez toujours la compilation TypeScript** (`npm run type-check` dans le dossier backend) avant de générer les types OpenAPI (`npm run generate:openapi`). Les erreurs de compilation empêcheront la génération correcte de `openapi.json` et, par conséquent, des DTOs.
5.  Les modifications des schémas backend qui affectent les DTOs doivent être suivies d'une exécution de la commande de génération et le résultat doit être commité.