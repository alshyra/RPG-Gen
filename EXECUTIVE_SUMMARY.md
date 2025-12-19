# 📌 EXECUTIVE SUMMARY - Refonte Système de Voies

## 🎯 Objectif Global
Migrer d'un système D&D 5e rigide vers un **système de Voies (Talent Trees)** flexible et adapté au RPG tactique solo.

---

## 📊 Vue Rapide des Changements

### AVANT (D&D 5e)
```
Création Perso: 7 étapes (stats, compétences, sorts, etc.)
  ↓
Classe: 12 classes différentes (Barbarian, Wizard, Rogue, etc.)
  ↓
Progression: 20 niveaux avec slots de sorts, ASI, features
  ↓
Combat: Sorts avec slots limités, actions bonus
  ↓
Complexité: Haute (beaucoup de règles D&D)
```

### APRÈS (Système de Voies)
```
Création Perso: 4 étapes (nom → classe → inventaire auto → avatar)
  ↓
Classe: 3 classes (Guerrier, Rogue, Mage)
  ↓
Progression: Points de Talent pour débloquer Voies/Rangs
  ↓
Combat: Aptitudes avec coût PA unifié, scaling auto
  ↓
Complexité: Basse (approche Chroniques Oubliées simplifiée)
```

---

## 🔥 Changements Majeurs par Domaine

### 1️⃣ Character Creation (VISIBLE IMMÉDIATEMENT)
| Ancien | Nouveau |
|--------|---------|
| StepAbilityScores | ❌ SUPPRIMÉ |
| StepSkills | ❌ SUPPRIMÉ |
| StepSpells | ❌ SUPPRIMÉ |
| StepCombat | ❌ SUPPRIMÉ |
| StepInventory (manuel) | ✅ Automatique par classe |
| **Nouveau:** StepClassSelection | 3 cartes visuelles prédominantes |

### 2️⃣ Database Schema
- `ClassDefinition` : ✅ Déjà préparé (talentTrees Map)
- `Character.classes` : 🔄 Adapter (+ talentPoints, voies)
- `Character.spells` : 🔄 Remplacer par `learnedAptitudes`
- `SpellDefinition` : 📦 Archiver (remplacé par Aptitude)

### 3️⃣ Backend Services
- `classes.service.ts` : ✂️ Supprimer (obsolète D&D)
- `levelup.service.ts` : ✂️ Supprimer (remplacé par progression.service)
- `aptitude.service.ts` : ✨ Créer (nouvelle logique)
- `talent-tree.service.ts` : ✨ Créer (unlock voies)
- `progression.service.ts` : ✨ Créer (gestion points)

### 4️⃣ Frontend Services
- `dndLevelUpService.ts` : ✂️ Supprimer
- `dndRulesService.ts` : 🔍 Nettoyer (garder GENDERS)
- `talentTreeService.ts` : ✨ Créer

### 5️⃣ Combat System
- Coûts: `spellSlots` → `PA` (Points d'Action)
- Scaling: Manual → Automatique (`1 + Math.floor(level/5)`)
- Cooldown: Nouveau système à implémenter
- Selection: Pas de choix post-creation, déverrouillage via progression

---

## 📈 Phases d'Implémentation (Ordre)

```
┌─ Phase 1: Schémas MongoDB (Fondation)
│
├─ Phase 2: Services (Logique métier)
│
├─ Phase 3: DTOs (Contrats API)
│
├─ Phase 4: Seed Data (Données)
│
├─ Phase 5: API Endpoints (Exposition)
│
├─ Phase 6: Character Creation UI ⭐ (VISIBLE)
│  ├─ StepClassSelection (3 cartes)
│  ├─ StepInventory (auto par classe)
│  └─ Suppression 4 steps obsolètes
│
├─ Phase 7: Talent Tree UI (Post-creation)
│  └─ Sélection Voies/Rangs dans game
│
└─ Phase 8: Tests & QA (Validation)
```

**Durée estimée** : 3-4 semaines (avec development constant)

---

## ✨ Gains Utilisateur

### 🎮 UX Simplifiée
- **Avant**: "Quels ability scores? Quelles compétences? Quels sorts?"
- **Après**: "Guerrier, Rogue, ou Mage?" → Inventaire auto → C'est bon! 🎯

### 📉 Moins de D&D Jargon
- Suppression: Proficiency bonus, ASI, spell slots, hit die
- Simplification: 3 classes claires vs 12 + multiclassing complexe

### 🎨 Création Visuelle
- 3 grandes cartes de classe avec images
- Stats en badges colorés (HP, PA, PM)
- Descriptions en 2 lignes max

### ⚔️ Combat Accessible
- "Attaque coûte 1 PA" (simple)
- vs "Attaque bonus? Bonus d'action? Réaction?" (complexe)

---

## 🗺️ Roadmap Détaillée par Phase

### Phase 1-2: Backend Fondation (1 semaine)
```
✅ Créer Aptitude schema
✅ Adapter Character schema
✅ Créer progression service
✅ Créer talent-tree service
→ Teste avec seed data de base
```

### Phase 3-4: API et Data (1 semaine)
```
✅ Créer DTOs pour aptitudes/voies
✅ Créer seed: aptitudes.json + voies.json
✅ Endpoints: GET voies, POST unlock-rank
→ Teste API avec Postman/tests
```

### Phase 5-6: Character Creation UI (1 semaine) ⭐
```
✅ Créer StepClassSelection (3 cartes)
✅ Adapter StepInventory (auto)
✅ Supprimer 4 steps obsolètes
✅ Nettoyer imports (dndLevelUpService)
→ Test création avec 3 classes
```

### Phase 7: Talent Tree UI (1 semaine)
```
✅ Créer StepVoieSelection
✅ Créer VoieProgressPanel
✅ Intégrer unlock voie au game
→ Test progression talent points
```

### Phase 8: Tests & Cleanup (1 semaine)
```
✅ Tests E2E character creation
✅ Tests talent tree progression
✅ Suppression code mort final
✅ Documentation
→ QA passe, CI green
```

---

## 🎓 Concepts Clés Expliqués

### Voie vs Rang vs Aptitude
```
Classe: Guerrier
  └─ Voie: Voie de la Lumière
      ├─ Rang 1 → Aura Protectrice (aptitude déverrouillée)
      ├─ Rang 2 → Riposte Divine (aptitude déverrouillée)
      └─ Rang 3 → Bouclier Sacré (aptitude déverrouillée)
```

### Points de Talent
```
Niveau 1: perso gagne 1 point de talent
Niveau 3: +1 point (total 2)
Niveau 5: +1 point (total 3)

Utilisation: Dépenser point → débloquer Rang 2 d'une Voie
```

### Aptitude et Coût PA
```
Aptitude: "Aura Protectrice"
  cost_pa: 2      // Coûte 2 PA pour utiliser
  cooldown: 2     // Réutilisable après 2 tours
  range: 4        // Portée 4 cases
  effect: "réduit dégâts ennemis de 1"
  scaling: "1 + Math.floor(level/5)"  // À N5 → 2 de réduction
```

---

## 💾 Code Mort à Supprimer

| Type | Count | Exemple |
|------|-------|---------|
| Vue Components | 4 | StepAbilityScores, StepSkills, etc. |
| Frontend Services | 2 | dndLevelUpService, dndRulesService |
| Backend Services | 2 | classes.service, levelup.service |
| DTOs | 3 | AbilityScoresResponseDto, etc. |
| Seed Files | 5+ | spells.json, levels.json, etc. |
| Tests | 10+ | Tests des components/services supprimés |

**Total**: ~27 fichiers à traiter (supprimer ou nettoyer)

→ Voir: [DEAD_CODE_CLEANUP.md](DEAD_CODE_CLEANUP.md)

---

## 🧮 Estimation Effort

### Backend (Schémas + Services + Seed)
- Phase 1-4: 3-4 jours
- Effort: Moyen (structures MongoDB, services NestJS)
- Risk: Moyen (migration données si déjà en prod)

### Frontend (Creation + Talent Tree UI)
- Phase 5-7: 2-3 jours
- Effort: Moyen-Bas (Vue 3 composables, pas complexe)
- Risk: Bas (pas de logique d'état complexe)

### Testing & Cleanup
- Phase 8: 2 jours
- Effort: Bas-Moyen
- Risk: Bas

**Total**: ~1-2 semaines work (avec tests et documentation)

---

## 🚀 Points d'Entrée pour Agent Coding

### RECOMMANDATION: Ordre séquentiel
1. **Commencer Phase 1** (Schémas) - fondation
2. **Puis Phase 4** (Seed) - données pour tester
3. **Puis Phase 6** (Character Creation) - voir le résultat immédiatement
4. **Puis Phases 2-3-5-7** - complétion
5. **Enfin Phase 8** - tests + nettoyage

### Alternative: Parallèle
- Pendant que backend (1-5) : Frontend (6-7) peut commencer plus tôt

### Ressources
- [SYSTEM_OVERHAUL_ANALYSIS.md](SYSTEM_OVERHAUL_ANALYSIS.md) - Vision complète
- [DEAD_CODE_CLEANUP.md](DEAD_CODE_CLEANUP.md) - Code à supprimer
- [STEPINVENTORY_REFACTOR.md](STEPINVENTORY_REFACTOR.md) - Exemple détaillé

---

## ✅ Succès Criteria

- [ ] Character creation réduit à 4 steps
- [ ] 3 cartes de classe visuellement distinctes
- [ ] Inventaire attribué automatiquement (0 clics utilisateur)
- [ ] Backend endpoints fonctionnels (API)
- [ ] Tests coverage > 80%
- [ ] Code mort supprimé (0 import vers d&d services)
- [ ] CI/CD passe (aucune erreur TypeScript)
- [ ] Documentation complète (architecture, seeds, APIs)

---

## 📞 Questions Fréquentes

### Q: Peut-on faire une migration progressive?
**R**: Oui. Phase 1-4 peuvent être en "feature branch", Phase 6 switch la UI une fois prête.

### Q: Et les données en production?
**R**: Créer un script de migration (Character.classes → Character.voies). À faire en Phase 1-2.

### Q: Les sorts D&D restent?
**R**: SpellDefinition peut rester si utilisé en combat. Sinon, archiver dans _DEPRECATED/.

### Q: Multi-classing?
**R**: Oui! Débloquer plusieurs Voies indépendamment. "Multi-Voies" est libre.

### Q: Backwards compatibility?
**R**: Non. C'est une refonte. Anciens personnages D&D ne fonctionneront plus tel quel.

---

## 🎬 Prochaine Étape

Décision à prendre:
1. **Agent autonome** : Implémenter Phase 1-6 en parallèle (rapide)
2. **Humain-first** : Review/approbation à chaque phase (safe)
3. **Hybrid** : Agent fait 1-4, humain review 6 avant suppression code mort

Recommandation: **Agent autonome** avec checkpoints à Phase 5 et 8.

---

**Document généré**: 19 décembre 2025  
**Version**: 1.0  
**Status**: Prêt pour implémentation 🚀
