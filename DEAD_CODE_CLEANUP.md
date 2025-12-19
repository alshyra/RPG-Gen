# Code Mort à Supprimer - Refonte Système de Voies

## 🗑️ Contexte
Cette liste cataloguedonné tout le code à supprimer lors de la Phase 6 (Character Creation Refactoring).

---

## Frontend - Components à SUPPRIMER COMPLÈTEMENT

### 1. **StepAbilityScores.vue**
```
Chemin: apps/frontend/src/components/character-creation/steps/StepAbilityScores.vue
Raison: D&D ability scores supprimés du nouveau système
Action: ✂️ DELETE
```

### 2. **StepSkills.vue**
```
Chemin: apps/frontend/src/components/character-creation/steps/StepSkills.vue
Raison: Compétences D&D non utilisées dans le nouveau système
Action: ✂️ DELETE
```

### 3. **StepSpells.vue**
```
Chemin: apps/frontend/src/components/character-creation/steps/StepSpells.vue
Raison: Remplacé par système de Voies post-création
Action: ✂️ DELETE
```

### 4. **StepCombat.vue**
```
Chemin: apps/frontend/src/components/character-creation/steps/StepCombat.vue
Raison: Sélection combat options supprimée
Action: ✂️ DELETE
```

### 5. **StepInventory.vue** (❌ NOW AUTO-ASSIGNED)
```
Chemin: apps/frontend/src/components/character-creation/steps/StepInventory.vue
Raison: Inventory is NOW auto-assigned by backend when user selects a class
Action: ✂️ DELETE - No longer needed in wizard (wizard is now 3 steps, not 4)
```

### 6. **ClassSelection.vue** (if exists from old system)
```
Chemin: apps/frontend/src/components/character-creation/steps/ClassSelection.vue
Raison: À remplacer par StepClassSelection.vue
Action: 🔄 REMPLACER (voir Phase 6)
```

---

## Frontend - Services à SUPPRIMER COMPLÈTEMENT

### 6. **dndLevelUpService.ts**
```
Chemin: apps/frontend/src/services/dndLevelUpService.ts
Raison: Logique D&D 5e pour level-up (ASI, proficiency, spells slots)
Remplacement: talentTreeService.ts (à créer)
Action: ✂️ DELETE
Dépendances à vérifier:
  - Chercher tous les imports via: grep -r "dndLevelUpService" apps/frontend/src/
  - Remplacer par talentTreeService après création
```

### 7. **dndRulesService.ts** (Partiellement)
```
Chemin: apps/frontend/src/services/dndRulesService.ts
Raison: Service D&D spécifique
Contenu à CONSERVER:
  - GENDERS export (utilisé en StepBasicInfo)
  - Constantes génériques (si réutilisées)
Contenu à SUPPRIMER:
  - Configurations D&D (classes, proficiencies, ability scores)
  - Calculs de niveaux
  - Tables de progression D&D
Action: 🔍 REVIEW ET NETTOYER
```

---

## Frontend - Composables à Adapter/Supprimer

### 8. **useSpellManagement.ts** (Probablement)
```
Chemin: apps/frontend/src/composables/useSpellManagement.ts
Raison: Gère selection de sorts (remplacé par talent trees)
Chercher usages: grep -r "useSpellManagement" apps/frontend/src/
Action: 🔍 REVIEW - Supprimer si uniquement utilisé en creation
```

### 9. **useClasses.ts** (À vérifier)
```
Chemin: apps/frontend/src/composables/useClasses.ts
Raison: Charge données D&D class progression
Remplacement: API endpoints Phase 5
Action: 🔍 REVIEW - Adapter si utilisé en combat, sinon DELETE
```

---

## Backend - Services à REMPLACER

### 10. **classes.service.ts**
```
Chemin: apps/backend/src/domain/classes/classes.service.ts
Raison: Service D&D 5e complet (ASI, proficiency, spell progression)
Remplacement: talent-tree.service.ts + progression.service.ts
Action: ✂️ DELETE après Phase 2
Dépendances:
  - Vérifier imports dans character.module.ts
  - Vérifier utilisations via: grep -r "ClassesService" apps/backend/src/
```

### 11. **levelup.service.ts**
```
Chemin: apps/backend/src/domain/character/levelup.service.ts
Raison: Applique gains de niveaux D&D 5e
Remplacement: progression.service.ts
Action: ✂️ DELETE après Phase 2
Dépendances:
  - Vérifier endpoints character controller
  - Remplacer endpoint POST /characters/:id/level-up
```

---

## Backend - Schemas à Évaluer

### 12. **SpellDefinition.ts** (Évaluer)
```
Chemin: apps/backend/src/infra/mongo/spell/SpellDefinition.ts
Raison: Représentation D&D 5e des sorts
Remplacement: Aptitude.ts
Utilisé en combat?: 🔍 VÉRIFIER
  - Chercher: grep -r "SpellDefinition" apps/backend/src/domain/combat/
  - Si oui: Garder, adapter progressivement
  - Si non: Archiver seulement (ne pas supprimer DB)
Action: 🔄 ADAPTER ou 📦 ARCHIVER
```

### 13. **AbilityScores.ts** (Character subdoc)
```
Chemin: apps/backend/src/infra/mongo/character/AbilityScores.ts
Raison: Scores d'ability D&D (Str, Dex, Con, etc.)
Utilisé en combat?: 🔍 VÉRIFIER
  - Chercher: grep -r "AbilityScores" apps/backend/src/domain/combat/
  - Si utilisé: Adapter (convertir en stats simples)
  - Si non: Supprimer de Character schema
Action: 🔄 ADAPTER dans Character.ts
```

### 14. **CharacterClass.ts** (Subdoc de Character)
```
Chemin: apps/backend/src/infra/mongo/character/CharacterClass.ts
Raison: Structure D&D pour classes (nom, level, hit die)
Remplacement: Nouvelle structure avec talentPoints, voies
Action: 🔄 REMPLACER (voir Phase 1)
```

### 15. **Skill.ts** (Character subdoc)
```
Chemin: apps/backend/src/infra/mongo/character/Skill.ts
Raison: Compétences D&D
Utilisé en game?: 🔍 VÉRIFIER
Action: 🔍 REVIEW - Supprimer de Character si inutilisé
```

---

## Backend - Seed Data à Archiver

### 16. **spells.json** (Complet)
```
Chemin: apps/backend/seed/spells.json
Raison: Base de données D&D 5e (300+ sorts)
Remplacement: aptitudes.json (Phase 4)
Action: 📦 ARCHIVER (renommer en _DEPRECATED_spells.json)
Garder backup?: OUI (pour référence)
```

### 17. **classes/wizard/levels.json** (et tous les levels.json)
```
Chemins: apps/backend/src/seed/classes/*/levels.json
Raison: Progression D&D par classe/niveau
Remplacement: aptitudes.json + voies.json + progression.json
Action: 📦 ARCHIVER (renommer chacun en _DEPRECATED_levels.json)
Garder backup?: OUI (pour référence)
```

### 18. **classes/wizard/allowed-spells.full.json** (etc)
```
Chemins: apps/backend/src/seed/classes/*/allowed-spells.full.json
Raison: Sorts débloqués par classe/niveau D&D
Remplacement: Structure voies + rangs + aptitudes
Action: 📦 ARCHIVER ou ✂️ DELETE (vérifier si non-critique)
```

### 19. **Autres fichiers D&D seed**
```
Chercher: apps/backend/seed/classes/*/
Exemple: barbarian/levels.json, fighter/levels.json, etc.
Action: 📦 ARCHIVER tous ceux inutilisés
```

---

## DTOs / Types à Supprimer

### 20. **AbilityScoresResponseDto**
```
Chemin: apps/backend/src/domain/character/dto/AbilityScoresResponseDto.ts
Raison: Scores D&D
Utilisé?: grep -r "AbilityScoresResponseDto" apps/
Action: ✂️ DELETE si unused
```

### 21. **SkillResponseDto**
```
Chemin: apps/backend/src/domain/character/dto/SkillResponseDto.ts
Raison: Compétences D&D
Utilisé?: grep -r "SkillResponseDto" apps/
Action: ✂️ DELETE si unused
```

### 22. **LevelUpOptionsDto** (ou adapter)
```
Chemin: apps/backend/src/domain/character/dto/LevelUpOptionsDto.ts
Raison: Offre choix D&D (spells, ASI, features)
Remplacement: TalentProgressDto (voir Phase 3)
Action: 🔄 ADAPTER ou ✂️ DEPRECATE
Si DEPRECATE:
  - Remplacer usages dans character.controller
  - Créer TalentProgressDto
```

---

## Testing - Tests à Mettre à Jour/Supprimer

### 23. **Tests des steps supprimées**
```
Chemins:
  - apps/frontend/src/components/character-creation/steps/__tests__/StepAbilityScores.test.ts
  - apps/frontend/src/components/character-creation/steps/__tests__/StepSkills.test.ts
  - apps/frontend/src/components/character-creation/steps/__tests__/StepSpells.test.ts
  - apps/frontend/src/components/character-creation/steps/__tests__/StepCombat.test.ts

Action: ✂️ DELETE (tests pour composants supprimés)
```

### 24. **CharacterCreatorWizard.test.ts**
```
Chemin: apps/frontend/src/components/character-creation/__tests__/CharacterCreatorWizard.test.ts
Raison: Tests basés sur ancien flux (7 steps)
Action: 🔄 ADAPTER
  - Mettre à jour steps list (4 steps)
  - Enlever assertions pour steps supprimées
  - Ajouter assertions pour class selection
```

### 25. **Tests services D&D**
```
Chemins:
  - apps/frontend/src/services/__tests__/dndLevelUpService.test.ts
  - apps/frontend/src/services/__tests__/dndRulesService.test.ts

Action: ✂️ DELETE (services supprimés)
```

### 26. **Backend: ClassesService tests**
```
Chemin: apps/backend/test/unit/domain/classes/classes.service.ts (ou intégration)
Action: ✂️ DELETE après que Phase 2 services soient en place
```

### 27. **Backend: LevelUpService tests**
```
Chemin: apps/backend/test/*/levelup.service.test.ts
Action: ✂️ DELETE après que progression.service soit en place
```

---

## 🗺️ Ordre de Suppression

⚠️ **À faire dans cet ordre pour éviter breakage:**

1. **Phase 1-5** : Créer tous les nouveaux services/DTOs/endpoints AVANT suppression
2. **Frontend services** : 
   - Remplacer `dndLevelUpService` usage → `talentTreeService`
   - Supprimer `dndLevelUpService.ts`
   - Nettoyer `dndRulesService.ts`
3. **Frontend components** :
   - Adapter `CharacterCreatorWizard.vue` (4 steps)
   - Créer `StepClassSelection.vue`
   - Supprimer `StepAbilityScores`, `StepSkills`, `StepSpells`, `StepCombat`
4. **Backend services** :
   - Migration caractères via script (classes → talentTrees)
   - Vérifier aucun endpoint n'appelle `classes.service`
   - Supprimer `classes.service.ts`
   - Supprimer `levelup.service.ts`
5. **Seed data** :
   - Charger `aptitudes.json`, `voies.json`, `progression.json`
   - Archiver `seed/spells.json`
   - Archiver `seed/classes/*/levels.json`
6. **Tests** :
   - Adapter/supprimer tests en parallèle

---

## 🔍 Scripts de Vérification

### Trouver tous les imports d'un service à supprimer
```bash
grep -r "dndLevelUpService" apps/frontend/src/
grep -r "ClassesService" apps/backend/src/
grep -r "LevelUpService" apps/backend/src/
```

### Trouver tous les DTOs inutilisés
```bash
grep -r "AbilityScoresResponseDto" apps/
grep -r "SkillResponseDto" apps/
grep -r "LevelUpOptionsDto" apps/
```

### Vérifier usage de schemas
```bash
grep -r "SpellDefinition" apps/backend/src/
grep -r "AbilityScores" apps/backend/src/
grep -r "CharacterClass" apps/backend/src/
```

---

## ✅ Checklist Nettoyage Final

- [ ] Tous les nouveaux services/DTOs/endpoints créés (Phase 1-5)
- [ ] Imports de `dndLevelUpService` migrés
- [ ] `dndLevelUpService.ts` supprimé
- [ ] `dndRulesService.ts` nettoyé
- [ ] 4 steps uniquement en CharacterCreatorWizard
- [ ] `StepClassSelection.vue` créé et intégré
- [ ] `StepAbilityScores.vue` supprimé
- [ ] `StepSkills.vue` supprimé
- [ ] `StepSpells.vue` supprimé
- [ ] `StepCombat.vue` supprimé
- [ ] `classes.service.ts` supprimé (backend)
- [ ] `levelup.service.ts` supprimé (backend)
- [ ] Tests de steps supprimées : deleted
- [ ] `CharacterCreatorWizard.test.ts` adapté
- [ ] Seed data archivé (spells.json, levels.json)
- [ ] DTOs obsolètes supprimés
- [ ] CI/CD passe (aucune erreur de import)
- [ ] Aucun warning sur code mort

---

## 📝 Notes

- **Backup important** : Archiver plutôt que supprimer les gros fichiers JSON (spells.json)
- **Migration données** : Si DB en prod, créer migration script
- **Graduel** : Peut être fait au fil du temps si nécessaire
- **Tests** : Adapter avant suppression pour ne pas bloquer CI
