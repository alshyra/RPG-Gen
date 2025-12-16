# Plan: Détection Automatique Fin de Combat via Status Watcher

**Date**: 16 décembre 2025  
**Objectif**: Détecter automatiquement la fin du combat en surveillant les mises à jour du status combat au lieu de rustines dans chaque action.

---

## 🎯 Problème Actuel

Après une attaque qui tue le dernier ennemi:
1. Backend retourne réponse d'action sans `combatEnd`
2. Frontend ne sait pas que c'est fini
3. Modale de victoire n'apparaît pas

### Pourquoi `combatEnd` n'est pas dans `/action` ?

Le backend `executeAttack()` (dans `combat-action.orchestrator.ts`):
- ✅ Update HP des ennemis
- ✅ Sauvegarde dans MongoDB
- ❌ Ne calcule PAS `combatEnd`
- ❌ Ne retourne PAS la victoire/défaite

---

## ✅ Solution Proposée: Watcher sur Status

### Architecture

```
┌─────────────┐
│  Frontend   │
│  Action UI  │
└──────┬──────┘
       │ 1. executeAction()
       ▼
┌─────────────┐
│   Backend   │
│  /action    │
└──────┬──────┘
       │ 2. { success, damage, ... }
       ▼
┌─────────────┐
│  TanStack   │
│    Query    │◄─── 3. onSuccess: invalidate status query
└──────┬──────┘
       │ 4. Auto-refetch /status
       ▼
┌─────────────┐
│  useCombat  │
│   Watcher   │◄─── 5. watch(enemies.value.length)
└──────┬──────┘
       │ 6. Si 0 ennemis → handleCombatEnd()
       ▼
┌─────────────┐
│Combat Modal │
└─────────────┘
```

### Flux Complet

1. **User clique attaque** → `executeAttack()`
2. **Backend traite** → retourne résultat action (damage, success, etc)
3. **TanStack onSuccess** → invalide query `combatKeys.status(characterId)`
4. **Auto-refetch** → `/status` appelé automatiquement
5. **combatInfo.enemies.value** → mise à jour avec nouvelle data
6. **Watcher détecte** → `enemies.length === 0` ou `player.hp <= 0`
7. **handleCombatEnd()** → modale victoire s'affiche

---

## 📋 Implémentation

### Étape 1: Ajouter Watchers dans `useCombat.ts`

**Fichier**: `apps/frontend/src/composables/useCombat.ts`

```typescript
import { watch } from "vue";

export function useCombat() {
  const combatInfo = useCombatInfo();
  const combatStore = useCombatStore();
  
  // ... existing code ...

  // ─────────────────────────────────────────────────────
  // Watcher 1: Detect Victory (all enemies defeated)
  // ─────────────────────────────────────────────────────
  watch(
    () => ({
      enemyCount: combatInfo.enemies.value.length,
      inCombat: combatInfo.inCombat.value,
    }),
    ({ enemyCount, inCombat }) => {
      // Si combat actif ET plus d'ennemis vivants
      if (inCombat && enemyCount === 0) {
        const defeatedNames = combatInfo.enemies.value.map(e => e.name);
        void handleCombatEnd(
          true,  // victory
          0,     // xpGained (pas dispo dans status)
          defeatedNames,
          "Tous les ennemis ont été vaincus !",
        );
      }
    },
  );

  // ─────────────────────────────────────────────────────
  // Watcher 2: Detect Defeat (player HP <= 0)
  // ─────────────────────────────────────────────────────
  watch(
    () => ({
      playerHp: combatInfo.player.value?.hp ?? 0,
      inCombat: combatInfo.inCombat.value,
    }),
    ({ playerHp, inCombat }) => {
      // Si combat actif ET joueur mort
      if (inCombat && playerHp <= 0) {
        void handleCombatEnd(
          false, // victory = false
          0,
          [],
          "Vous avez été vaincu...",
        );
      }
    },
  );

  return { /* ... */ };
}
```

### Étape 2: Cleanup `checkCombatVictory` (Optionnel)

Si on garde `checkCombatVictory()` pour détecter les combatEnd explicites du backend, on peut la simplifier :

```typescript
const checkCombatVictory = (result: CombatActionResponseDto): void => {
  // Only check explicit combatEnd from backend
  // Watcher handles implicit detection
  if (!result.combatEnd) return;
  
  void handleCombatEnd(
    result.combatEnd.victory,
    result.combatEnd.xp_gained,
    result.combatEnd.enemies_defeated,
    result.narrative!,
  );
};
```

### Étape 3: Prévenir Double Trigger

Problème potentiel: Watcher + `combatEnd` explicite = double trigger.

**Solution**: Flag dans combatStore

```typescript
// combatStore.ts
const isCombatEndTriggered = ref(false);

// useCombat.ts - dans les watchers
if (inCombat && enemyCount === 0 && !combatStore.isCombatEndTriggered) {
  combatStore.isCombatEndTriggered = true;
  void handleCombatEnd(...);
}

// Reset flag dans closeCombatEndModal
const closeCombatEndModal = async () => {
  // ... existing code ...
  combatStore.isCombatEndTriggered = false;
};
```

---

## 🧪 Tests à Faire

### Test 1: Victoire Standard
1. Démarrer combat avec 1 goblin
2. Attaquer jusqu'à mort
3. ✅ Vérifier modale victoire apparaît
4. ✅ Vérifier message "Tous les ennemis vaincus"

### Test 2: Victoire Multi-Ennemis
1. Démarrer combat avec 3 ennemis
2. Tuer les 2 premiers
3. ✅ Vérifier modale ne s'ouvre PAS encore
4. Tuer le dernier
5. ✅ Vérifier modale victoire apparaît

### Test 3: Défaite
1. Démarrer combat
2. Prendre des dégâts jusqu'à HP <= 0
3. ✅ Vérifier modale défaite apparaît
4. ✅ Vérifier message "Vous avez été vaincu"

### Test 4: Pas de Double Trigger
1. Démarrer combat
2. Tuer dernier ennemi
3. ✅ Vérifier modale apparaît 1 seule fois
4. ✅ Vérifier pas de double navigation

### Test 5: Backend avec combatEnd Explicite
1. Modifier backend pour retourner `combatEnd`
2. Tuer ennemi
3. ✅ Vérifier modale apparaît correctement
4. ✅ Vérifier XP correctement affichés

---

## 📊 Impacts

### ✅ Avantages

| Aspect | Avant | Après |
|--------|-------|-------|
| **Détection** | ❌ Ne marche pas | ✅ Automatique |
| **Maintenance** | ❌ Rustines partout | ✅ 1 seul endroit |
| **Évolutivité** | ❌ Fragile | ✅ Scalable |
| **Latence** | N/A | +1 request (déjà fait) |
| **Backend changes** | ❌ Requis | ✅ Aucun |

### ⚠️ Considérations

**Latence**: +50-100ms pour refetch `/status` après action
- Acceptable car déjà fait par TanStack Query
- Utilisateur voit animation attaque pendant ce temps

**Race conditions**: Si plusieurs actions rapides
- TanStack Query déduplique automatiquement
- Dernier status = source de vérité

**Multijoueur**: Si implémenté plus tard
- Watcher marche out-of-the-box
- Pas de logique à refactoriser

---

## 🚀 Ordre d'Exécution

1. **[5min]** Ajouter watchers dans `useCombat.ts`
2. **[2min]** Ajouter flag `isCombatEndTriggered` dans `combatStore.ts`
3. **[3min]** Tester manuellement (1 combat victoire + 1 défaite)
4. **[2min]** Cleanup `checkCombatVictory()` si tout OK
5. **[5min]** Commit + PR

**Total**: ~15-20 minutes

---

## 📝 Checklist Avant Merge

- [ ] Modale victoire s'affiche quand dernier ennemi meurt
- [ ] Modale défaite s'affiche quand joueur meurt
- [ ] Pas de double trigger de modale
- [ ] Type-check passe (`npm run type-check`)
- [ ] Pas de console errors dans le navigateur
- [ ] Navigation correcte après fermeture modale

---

## 🔮 Améliorations Futures (Optionnel)

### Backend: Retourner `combatEnd` Explicite

Si on veut plus de données (XP, loot):

```typescript
// combat-action.orchestrator.ts - executeAttack()
const allEnemiesDead = session.enemies.every(e => (e.hp ?? 0) <= 0);
if (allEnemiesDead) {
  const combatEnd: CombatEndDto = {
    victory: true,
    xp_gained: 100,
    enemies_defeated: session.enemies.map(e => e.name),
  };
  
  return {
    // ... existing fields ...
    combatEnd,
  };
}
```

Bénéfice: Frontend aura XP immédiatement sans attendre `/status`.

### Polling Status en Background

Si combat long ou multijoueur:

```typescript
// combat.api.ts
const status = useQuery({
  // ... existing config ...
  refetchInterval: (query) => {
    const inCombat = query.state.data?.inCombat;
    return inCombat ? 5000 : false; // Poll every 5s if in combat
  },
});
```

---

**Status**: 🟡 Ready to implement  
**Priorité**: 🔴 High (bloque UX victoire)  
**Complexité**: 🟢 Low (watchers simples)
