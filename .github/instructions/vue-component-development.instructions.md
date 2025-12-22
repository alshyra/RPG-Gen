---
applyTo: "apps/frontend/src/**/*.vue, packages/ui/src/**/*.vue"
---

# Vue 3 Component Development Instructions

Ce document fournit des directives et des meilleures pratiques pour le développement de composants Vue 3 dans le projet, en se concentrant sur l'API de Composition, la gestion des props, des événements, des slots et l'intégration de Tailwind CSS.

**Principes Clés :**

1.  **API de Composition :** Privilégiez l'API de Composition (`<script setup>`) pour organiser la logique des composants. Utilisez des fonctions réutilisables (`composables`) pour extraire et partager la logique d'état et les fonctionnalités entre les composants.
2.  **Props, Events, Slots :**
    *   **Props :** Définissez toujours les props avec une validation de type (`type`, `required`, `default`) explicite pour améliorer la robustesse des composants. Évitez de muter directement les props ; émettez des événements pour les mises à jour parentales.
    *   **Events :** Émettez des événements personnalisés (`emit`) pour communiquer les changements ou les interactions de l'enfant vers le parent. Nommez les événements de manière descriptive (e.g., `update:modelValue`, `item-selected`).
    *   **Slots :** Utilisez les slots pour rendre les composants plus flexibles et réutilisables, permettant aux composants parents d'injecter du contenu dans des zones spécifiques des composants enfants. Pour `apps/frontend`, privilégiez l'utilisation des stores et des références de `vuequery` plutôt que des props pour la gestion des données complexes et des états. Pour `packages/ui`, l'utilisation des props reste la méthode privilégiée pour la communication entre composants.
3.  **Styling avec Tailwind CSS :**
    *   Utilisez exclusivement Tailwind CSS pour le style des composants. Évitez le CSS en ligne ou les blocs `<style>` scoped, sauf pour des cas très spécifiques et justifiés (e.g., animations complexes qui nécessitent des keyframes).
    *   Priorisez les classes utilitaires de Tailwind. Si des styles complexes et récurrents sont nécessaires, créez des classes utilitaires personnalisées ou utilisez la directive `@apply` dans des fichiers CSS dédiés (mais avec parcimonie).
4.  **Réactivité :** Comprenez et utilisez correctement les primitives de réactivité de Vue ( `ref`, `reactive`, `computed`, `watchEffect`, `watch`) pour gérer l'état local et global des composants.
5.  **Accessibilité (A11y) :** Concevez les composants en tenant compte de l'accessibilité. Utilisez les attributs `aria-` appropriés et assurez-vous que la navigation au clavier est fonctionnelle.
6.  **Tests :** Chaque composant significatif devrait être accompagné de tests unitaires (avec Vitest) pour valider son comportement et son rendu. Concentrez-vous sur les interactions utilisateur et la logique interne.
7.  **Performance :** Soyez attentif aux performances, notamment lors de l'utilisation de listes volumineuses ou d'animations. Utilisez des techniques comme la virtualisation de listes si nécessaire.