---
applyTo: "apps/backend/src/external/text/gemini-text.service.ts, apps/backend/src/modules/chat/**/*.ts, apps/backend/src/controllers/chat.controller.ts"
---

# Gemini / Chat Integration Instructions

Ce document fournit des directives pour l'intégration avec l'API Gemini (via `gemini-text.service.ts`) et la gestion des interactions de chat narrative.

**Principes Clés :**

1.  **Extraction et Parsing Robustes :** Le `gemini-text.service.ts` est central pour l'extraction et le parsing des réponses de Gemini. Assurez-vous que toute modification ici maintient une logique robuste pour interpréter les instructions de jeu ou les données structurées (souvent au format JSON) intégrées dans le texte narratif.
2.  **Tests des Interactions AI :** Les interactions avec Gemini sont non-déterministes par nature. Dans les tests, préférez mocker (`mock`) ou éviter les appels directs à l'API Gemini. Rendez les interactions Gemini injectables (`injectable`) pour faciliter les tests unitaires et d'intégration sans dépendre des réponses externes.
3.  **Conventions de Parsing Narratif :** Les instructions de jeu sont souvent intégrées sous forme de JSON dans le texte narratif généré par Gemini. Le `game-parser.util.ts` est responsable de l'extraction et du nettoyage de ce JSON. Toute modification du format des instructions ou de la logique de parsing doit être accompagnée de mises à jour dans ce fichier et de tests correspondants.
4.  **Gestion des Payloads des Contrôleurs :** Les contrôleurs (e.g., `chat.controller.ts`) doivent rester stricts et explicites concernant la forme des requêtes. La validation et la normalisation appartiennent aux DTOs, aux pipes ou aux adaptateurs de plus haut niveau, pas directement aux méthodes des contrôleurs.
5.  **Éviter les Castings `as` et `any` :** Conformément aux règles générales du projet, évitez l'utilisation de `any` et les castings `as` pour maintenir la robustesse du typage, surtout lors de la manipulation des données provenant de sources externes comme Gemini.