---
applyTo: "packages/combat-engine/src/**/*.ts"
---

# Combat Engine Logic Instructions

Ce document décrit les conventions et les meilleures pratiques pour le développement et la modification du moteur de combat, en se basant sur PixiJS et la logique de jeu.

**Principes Clés :**

1.  **Séparation des Préoccupations :** Le moteur de combat doit clairement séparer la logique de jeu (calcul des dégâts, gestion des tours, application des états) de la présentation graphique (rendu PixiJS).
2.  **Gestion de l'État de Combat :** L'état du combat doit être géré de manière prévisible et réactive. Les modifications d'état doivent idéalement passer par un système de dispatch d'actions ou un gestionnaire d'état centralisé pour faciliter le débogage et la testabilité.
3.  **Actions de Combat :** Toutes les actions de combat (attaques, sorts, utilisation d'objets) doivent être définies de manière claire et extensible. Chaque action doit avoir une interface bien définie pour ses entrées et ses effets.
4.  **Intégration PixiJS :** Lors de l'intégration avec PixiJS, assurez-vous que le rendu visuel est synchronisé avec l'état logique du combat. Les animations et les effets visuels doivent être déclenchés par les événements de la logique de combat.
5.  **Performance :** Optimisez les performances du rendu PixiJS, surtout pour les animations et les mises à jour fréquentes, afin de garantir une expérience utilisateur fluide.
6.  **Testabilité :** La logique du moteur de combat doit être facilement testable. Isolez les unités de logique (calculs de dégâts, conditions d'effets) pour permettre des tests unitaires granulaires. Les tests d'intégration devraient valider le flux complet d'un tour de combat.
7.  **Données de Jeu Externes :** Le moteur de combat doit être capable de consommer des données de jeu définies en externe (sorts, statistiques des ennemis, définitions d'objets) pour permettre un équilibrage et des mises à jour sans modification du code du moteur lui-même.