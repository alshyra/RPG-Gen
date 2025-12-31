# Game Data Bounded Context

## Philosophie : Architecture Data-Driven

Le bounded context `game-data` est la **source unique de vérité** pour toutes les données de configuration du jeu. Cette architecture permet de rendre le jeu **entièrement configurable** sans modification de code.

### Principes Fondamentaux

1. **Les seeds contiennent les données brutes**
   - Caractéristiques de classes (HP, PA, PM)
   - Définitions d'aptitudes (basePower, scaling, cooldown)
   - Formules de calcul (multiplicateurs, bonus)
   
2. **Le code applique les formules, il ne les définit pas**
   - Aucune valeur hardcodée dans les services
   - Toutes les constantes viennent des seeds
   - Les formules sont paramétrables via `formulas.json`

3. **Les Value Objects encapsulent la logique métier**
   - `ClassStats` calcule les HP avec les valeurs du seed
   - `Aptitude` calcule la puissance avec ses propriétés
   - `FormulasService` applique les formules configurables

---

## Structure des Seeds

```
assets/
├── formulas.json       # Formules de calcul configurables
├── aptitudes.json      # Toutes les aptitudes/sorts
├── races.json          # Races jouables
├── enemies.json        # Ennemis pré-configurés
├── stats-and-skills.json
├── classes/            # Une classe par dossier
│   ├── guerrier/
│   │   ├── stats.json
│   │   └── talent-trees.json
│   ├── rogue/
│   └── mage/
└── items/
    ├── weapons.json
    ├── armors.json
    └── consumables.json
```

---

## Fichier formulas.json

Ce fichier centralise **toutes les formules de calcul** du jeu :

```json
{
  "combat": {
    "damage": {
      "description": "Damage = (basePower + scalingStatValue) * levelMultiplier",
      "levelMultiplierBase": 1.0,
      "levelMultiplierGrowth": 0.15
    },
    "healing": {
      "description": "Healing uses same formula as damage",
      "levelMultiplierBase": 1.0,
      "levelMultiplierGrowth": 0.15
    }
  },
  "character": {
    "hp": {
      "description": "HP = hpBase + (level * hpGain) + (survival * survivalBonus)",
      "survivalBonus": 2
    }
  }
}
```

### Modifier une formule

Pour changer le bonus de survie de 2 à 3 HP par point :
```json
"survivalBonus": 3
```

Pour rendre le level scaling plus agressif :
```json
"levelMultiplierGrowth": 0.20
```

---

## Services

### FormulasService

Service central qui charge et applique les formules du seed.

```typescript
// Au lieu de hardcoder :
const damage = (basePower + stat) * (1 + (level - 1) * 0.15);

// On utilise FormulasService :
const damage = formulasService.calculateDamage(basePower, statValue, level);
```

**Méthodes disponibles :**
- `calculateDamage(basePower, scalingStatValue, level)` - Calcul des dégâts
- `calculateHealing(basePower, scalingStatValue, level)` - Calcul des soins
- `calculateMaxHP(hpBase, hpGain, level, survival)` - HP maximum
- `rollInitiative(finesse)` - Jet d'initiative
- `calculateAptitudePower(basePower, scalingStatValue, proficiencyBonus)` - Puissance d'aptitude

### ClassDataService

Accès aux définitions de classes.

```typescript
const guerrier = await classDataService.findByName('guerrier');
const hpBase = guerrier.stats.hpBase; // 12 (du seed)
```

### AptitudeDataService

Accès aux définitions d'aptitudes.

```typescript
const fireball = await aptitudeDataService.findById('mag_tempete_arcanique');
const basePower = fireball.basePower; // 7 (du seed)
const scaling = fireball.scaling;     // "mind" (du seed)
```

---

## Comment ajouter une nouvelle aptitude

1. **Ajouter au seed** `aptitudes.json` :
```json
{
  "id": "war_nouvelle_aptitude",
  "name": "Nouvelle Aptitude",
  "paCost": 2,
  "cooldown": 2,
  "targetType": "enemy",
  "range": 3,
  "basePower": 6,
  "scaling": "vigor",
  "descriptionForAi": "Description pour l'IA narrative."
}
```

2. **C'est tout !** Pas de code à modifier.

---

## Comment modifier les stats d'une classe

Modifier `classes/{className}/stats.json` :

```json
{
  "name": "guerrier",
  "hp_base": 14,      // Augmenter HP de base
  "hp_gain": 10,      // Plus de HP par niveau
  "pa": 5,            // Moins de PA
  "pm": 5,            // Plus de PM
  "main_stat": "vigor"
}
```

---

## Règles pour les développeurs

### ❌ NE PAS faire

```typescript
// INTERDIT : Valeurs hardcodées
const damage = basePower * 1.5;
const maxHp = 12 + level * 8;
const paMax = 6;
```

### ✅ À faire

```typescript
// CORRECT : Utiliser FormulasService
const damage = this.formulasService.calculateDamage(basePower, statValue, level);

// CORRECT : Utiliser les données du seed via ClassDataService
const classData = await this.classDataService.findByName(className);
const hpMax = this.formulasService.calculateMaxHP(
  classData.stats.hpBase,
  classData.stats.hpGain,
  level,
  survival
);
```

---

## Architecture des calculs

```
┌─────────────────┐     ┌──────────────────┐
│   formulas.json │────▶│  FormulasService │
└─────────────────┘     └────────┬─────────┘
                                 │
┌─────────────────┐              │
│  classes/*.json │──┐           │
└─────────────────┘  │           ▼
                     ├────▶ CombatAppService
┌─────────────────┐  │     EnemyTurnService
│ aptitudes.json  │──┘     CombatActionService
└─────────────────┘
```

**Flow de calcul de dégâts :**
1. L'aptitude fournit `basePower` et `scaling` (du seed)
2. Le personnage fournit la valeur de la stat de scaling
3. `FormulasService.calculateDamage()` applique la formule configurée
4. Le résultat est utilisé par le combat

---

## Tests

Les tests unitaires vérifient que :
- Les formules produisent les résultats attendus
- Les seeds sont correctement chargés
- Les modifications de formulas.json changent les calculs

```bash
npm run test -- --testPathPattern="game-data"
```

---

## Résumé

| Composant | Rôle |
|-----------|------|
| `formulas.json` | Définit les formules mathématiques |
| `classes/*.json` | Définit les stats de base des classes |
| `aptitudes.json` | Définit les aptitudes et leurs effets |
| `FormulasService` | Applique les formules du seed |
| `ClassDataService` | Fournit les données de classe |
| `AptitudeDataService` | Fournit les données d'aptitude |

**Le jeu est 100% configurable via les seeds.**
