---
applyTo: "apps/backend/src/seed/**/*.json, apps/backend/src/seed-manager.ts"
---

# Backend Seeds Documentation

Les seeds permettent d'initialiser la base de données grâce au `seedManager`, ce qui permet de faire évoluer et ajuster la puissance des sorts sans recoder le moteur de jeu.

Ce répertoire contient les fichiers JSON qui définissent les données initiales pour différentes entités du jeu (aptitudes, armures, ennemis, objets, races, sorts, packs de démarrage, statistiques et compétences, armes). Ces fichiers sont lus par le `seedManager` lors de l'initialisation de l'application pour peupler la base de données. Cela garantit une flexibilité accrue pour l'équilibrage du jeu et les mises à jour de contenu sans nécessiter de modifications directes dans la logique du moteur de jeu.