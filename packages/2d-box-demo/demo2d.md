## 💻 Prompt pour Intégrer les Sprites avec Konva.js

Ce prompt est en trois parties : le contexte, la logique de chargement Konva, et la mise à jour du rendu.

### 1\. Contexte et Objectif (Rappel des Contrats)

```prompt
Je travaille sur le composant Vue.js/Konva.js nommé "CombatGrid.vue" (Composition API, TypeScript).

L'objectif est de remplacer les Konva.Circle de mes unités (tokens) par des Konva.Image, en utilisant les fichiers de sprites que j'ai trouvés.

Contrats de Données Rappelés :
- La prop `units` contient une liste d'objets UnitToken.
- L'interface UnitToken est étendue :
  interface UnitToken {
    id: string;
    x: number;
    y: number;
    isPlayer: boolean;
    // NOUVELLE PROPRIÉTÉ POUR L'ASSET:
    spriteUrl: string; // Le chemin local vers le fichier image (ex: '/assets/gobelin.png')
  }

- La grille est de 7x7, chaque case fait 60x60 pixels.
```

### 2\. Logique Konva.js : Chargement Asynchrone des Images

C'est l'étape technique cruciale. Konva.js doit gérer le chargement d'image.

```prompt
Implémente la logique de chargement d'images suivante :

1.  **Réactivité :** Crée une carte réactive (`spritesMap: Ref<Map<string, HTMLImageElement>>`) pour stocker les objets `HTMLImageElement` chargés. La clé de la carte sera l'URL du sprite.
2.  **Fonction de Chargement :** Écris une fonction asynchrone `loadSprite(url: string)` qui prend une URL, charge l'image, et la stocke dans `spritesMap`.
3.  **Surveiller les Props :** Utilise un `watchEffect` pour itérer sur la prop `units`. Pour chaque unité, si son `spriteUrl` n'est pas encore dans `spritesMap`, appelle `loadSprite` pour charger l'image.

Cette approche garantit que les images sont chargées et mises à jour dès que la prop `units` change.
```

### 3\. Mise à Jour du Rendu

Maintenant, demandez la mise à jour du template.

```prompt
Modifie la section <template> pour le rendu des unités :

1.  Pour chaque unité dans `units`, remplace le composant `V-Circle` par un composant **`V-Image`** (de vue-konva).
2.  Le `V-Image` doit utiliser l'objet `HTMLImageElement` correspondant stocké dans `spritesMap` (récupéré via `unit.spriteUrl`).
3.  Le centre du sprite doit toujours être au centre de la case (par exemple, à `x*60 + 30`, `y*60 + 30`).
4.  Le sprite doit être redimensionné (par exemple, à 60x60 ou 50x50 pixels) pour s'adapter à la case. Utilise `width` et `height` sur `V-Image` pour définir la taille finale du sprite.
```
