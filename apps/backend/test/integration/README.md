# Backend Integration Tests

## Structure

Les tests d'intégration sont organisés par **domaine métier** dans des sous-dossiers :

```
test/integration/
├── README.md                     # Ce fichier
├── character/                    # Tests du domaine Character
│   └── character.integration.test.ts
├── combat/                       # Tests du domaine Combat
│   ├── combat.integration.test.ts
│   └── movement-pm.integration.test.ts
└── narrative/                    # Tests du domaine Narrative
    └── narrative.integration.test.ts
```

## Couverture par domaine

### Character (`character/`)
- CRUD: création draft, complétion, récupération, suppression
- Mise à jour: XP, dégâts, soins, stats
- Voies/Talents: progression, rangs multiples
- Inventaire: ajout, mise à jour quantité, suppression, équipement
- Points d'inspiration: attribution, dépense, cap à 5
- Personnages décédés: marquage, tracking
- Validation DTO: tous les endpoints retournent des DTO typés

### Combat (`combat/`)
- Initialisation: création d'état de combat avec ennemis
- Tour de jeu: ordre par initiative, tie-breaking
- Économie d'action: système PA/PM
- Dégâts: application aux ennemis et au joueur
- Mouvement: consommation de PM, validation de chemin
- Fin de combat: nettoyage d'état, XP, résultats

### Narrative (`narrative/`)
- Sessions: création, récupération
- Messages: ajout user/assistant, historique récent
- Nettoyage: effacement, suppression complète

## Conventions

1. **Un dossier par bounded context** : `character/`, `combat/`, `narrative/`
2. **Nommage** : `<feature>.integration.test.ts`
3. **Jest** : Tous les tests utilisent Jest avec `@jest/globals`
4. **Setup/Teardown** : Utiliser `createTestApp()` et `closeTestApp()` de `../helpers/test-app.ts`

## Exécution

```bash
# Tous les tests d'intégration
npm run test -- --testPathPatterns="integration"

# Tests d'un domaine spécifique
npm run test -- --testPathPatterns="integration/character"
npm run test -- --testPathPatterns="integration/combat"
npm run test -- --testPathPatterns="integration/narrative"
```
