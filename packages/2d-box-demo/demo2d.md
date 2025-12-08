## 💻 Prompt pour GitHub Copilot / Claude

L'objectif est de demander un composant **Vue.js** qui gère la logique d'affichage de la grille, l'affichage des jetons (tokens) des unités, et l'interactivité pour le mouvement.

### 1\. Contexte du Projet et des Outils

```prompt
Je travaille sur un projet de jeu de rôle tactique tour par tour en utilisant Vue.js (Composition API) et TypeScript. La logique de jeu (la matrice de carte, les positions des unités) est gérée par un backend NestJS.

Je souhaite utiliser **Konva.js** pour la visualisation 2D de la carte de combat. Konva.js est déjà installé.

Objectif : Créer un composant Vue.js nommé **"CombatGrid.vue"** qui affiche une grille tactique et les jetons des unités.
```

### 2\. Contrats de Données (Input Props)

Il est crucial de définir la structure des données que le composant recevra du backend (NestJS).

```prompt
Le composant recevra deux propriétés (props) principales :

1.  **`mapData: number[][]`** : Une matrice de 7x7 (tableau de tableaux de nombres) représentant la grille de combat. Chaque nombre est le type de terrain.
    * Exemple : `[[0, 0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], ...]`
2.  **`units: UnitToken[]`** : Une liste d'objets représentant les unités (joueur et ennemis).

Définition de l'interface TypeScript pour l'unité :
interface UnitToken {
  id: string;
  x: number; // Coordonnée X sur la grille (0-6)
  y: number; // Coordonnée Y sur la grille (0-6)
  isPlayer: boolean;
  color: string;
}
```

### 3\. Tâches d'Implémentation Spécifiques (Le Rendu Konva)

Maintenant, détaillez ce que Konva doit dessiner.

```prompt
Implémente le composant **CombatGrid.vue** en utilisant la Composition API :

1.  **Dimensions :** La grille doit être de 7x7. Chaque case (cellule) doit faire 60x60 pixels.
2.  **Initialisation Konva :** Crée un `Konva.Stage` dans le `mounted` du composant, ancré à un `ref`. La taille totale du Stage doit être 420x420.
3.  **Rendu de la Grille :** Utilise `Konva.Rect` pour dessiner toutes les 49 cases de la grille (7x7).
    * Les cases doivent avoir une bordure (stroke) et une couleur de fond différente selon `mapData[y][x]` (par exemple, vert clair si 0, marron si 1).
4.  **Rendu des Unités (Tokens) :** Utilise `Konva.Circle` pour représenter chaque unité dans la prop `units`.
    * Chaque cercle doit être centré dans sa case correspondante (position basée sur x, y).
    * La couleur du cercle doit venir de la propriété `color` de l'unité.
5.  **Interactivité (Clic de Mouvement) :** Attache un écouteur de clic à **chaque case de la grille**.
    * Lorsqu'une case est cliquée, émettre un événement nommé **`cell-clicked`** vers le parent Vue.js, en passant les coordonnées `(x, y)` de la case cliquée.
```

### 4\. Code Final (Pour l'Aide au Langage)

```prompt
Fournis le code complet du composant **CombatGrid.vue** (avec <template>, <script setup> et <style>). N'oublie pas d'utiliser les types TypeScript et d'initialiser correctement Konva.
```
