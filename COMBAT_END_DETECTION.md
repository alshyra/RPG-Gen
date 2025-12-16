# Plan: Détection Automatique Fin de Combat via Status Watcher

**Date**: 16 décembre 2025 (Mise à jour: analyse code + rustine identifiée)  
**Objectif**: Détecter automatiquement la fin du combat en surveillant les mises à jour du status combat au lieu de rustines dans chaque action.

---

## ⚡ TL;DR (pour impatients)

**La rustine:** Fonction `checkCombatVictory()` qui ne fait rien (ligne 186 de useCombat.ts)  
**Pourquoi:** Elle vérifie `result.combatEnd` qui est **toujours `undefined`** (backend ne retourne jamais)  
**Solution:** Ajouter 2 watchers qui écoutent `enemies.length === 0` et `player.hp <= 0`  
**Suppression:** Enlever `checkCombatVictory()` + son appel (7 lignes)  
**Temps:** ~10-15 min | Fichiers: 1 seul (`useCombat.ts`) | Complexité: 🟢 Low  

**Action plan:**
1. Ajouter `isCombatEndTriggered` flag
2. Ajouter 2 watchers (victory/defeat detection)
3. Reset flag dans `closeCombatEndModal()`
4. **Supprimer** `checkCombatVictory()` et son appel
5. Test manuel + commit

---

## 🎯 Résumé Exécutif

| Aspect | Détail |
|--------|--------|
| **Problème** | Modale victoire/défaite n'apparaît jamais (rustine dans `checkCombatVictory()` n'a aucun effet) |
| **Root Cause** | `checkCombatVictory()` vérifie `result.combatEnd` qui est `undefined` (backend ne le retourne pas) |
| **Solution** | Watchers sur `combatInfo.enemies` et `combatInfo.player.hp` (données mises à jour via TanStack) |
| **Code à supprimer** | Fonction `checkCombatVictory()` + son appel (7 lignes totales) |
| **Fichiers changés** | `useCombat.ts` uniquement |
| **Durée** | ~10-15 minutes |
| **Complexité** | 🟢 Low (watchers simples, pas de backend changes) |
| **Tests** | Manuel suffisant (2 combats: victoire + défaite) |

---

## 🎯 Problème Actuel

Après une attaque qui tue le dernier ennemi:
1. Backend retourne réponse d'action ✅
2. TanStack Query invalide et refetch `/status` ✅
3. `combatInfo.enemies.value.length` → 0 ✅
4. Frontend appelle `checkCombatVictory()` ❌ N'a aucun effet!
5. Modale ne s'affiche jamais ❌

### Analyse de `checkCombatVictory()`

**Ligne 186-192 dans `useCombat.ts`:**
```typescript
const checkCombatVictory = (result: CombatActionResponseDto): void => {
  if (!result.combatEnd) return;  // ← Toujours true (undefined)
  void handleCombatEnd(...);       // ← N'est JAMAIS appelé
};
```

**Pourquoi `result.combatEnd` est `undefined`?**
- Le backend `executeAttack()` ne retourne jamais `combatEnd`
- Code du backend n'implémente PAS cette logique
- Seul `/end-turn` (après ennemi attaque) retourne parfois combatEnd

**Preuve que c'est une rustine:**
- Fonction n'a aucun effet testé
- Appelée depuis `processAttackResult()` ligne 245
- Depuis le refactoring API-client, jamais mise à jour
- Comment c'était supposé marcher n'est pas clair

---

## ✅ Comment les Données sont Mises à Jour

### Architecture Actuelle (TanStack Query)

```
1. User clique attaque
   ↓
2. executeAttack() → combatApi.attack.mutateAsync()
   ↓
3. Backend /action endpoint → { damageTotal, combatState, ... }
   ↓
4. TanStack onSuccess hook
   → Invalide query "combat-status-{characterId}"
   ↓
5. Auto-refetch /status triggered
   ↓
6. combatInfo.enemies = computed from new status.data.enemies
   combatInfo.player = computed from new status.data.player
   ↓
7. Les computed sont RÉACTIFS
   → Watchers DÉTECTENT ces changements
```

### Code TanStack Actuel

**Dans `api-client/useCombat.ts` (generated):**
- La mutation `attack` a un `onSuccess` qui invalide `status`
- `status` est un `useQuery` qui auto-refetch quand invalidé
- Pas besoin de changer quoi que ce soit au backend

### Watchers Exploitent Cette Infrastructure

Les watchers écoutent simplement les changements:
```typescript
watch(
  () => combatInfo.enemies.value.length,
  (newCount) => {
    if (newCount === 0 && inCombat) {
      // Les données viennent de TanStack, pas du backend direct
      handleCombatEnd(true, ...);
    }
  },
);
```

---

## ✅ Solution Proposée: Watcher sur Status

### Architecture avec Watchers

```
                    ÉTAT INITIAL
                   (inCombat=true,
                   enemies=[goblin])
                        ↓
    ┌───────────────────────────────────────┐
    │ User clique attaque sur goblin        │
    └───────────────┬───────────────────────┘
                    ↓
    ┌───────────────────────────────────────┐
    │ executeAttack() → mutate.attack()      │
    │ {target, spellName, characterId}      │
    └───────────────┬───────────────────────┘
                    ↓
    ┌───────────────────────────────────────┐
    │ Backend /combat/:id/attack            │
    │ Retourne: {damageTotal: 25, ...}      │
    │ (NO combatEnd!)                       │
    └───────────────┬───────────────────────┘
                    ↓
    ┌───────────────────────────────────────┐
    │ TanStack onSuccess()                  │
    │ Invalide query "combat-status"        │
    └───────────────┬───────────────────────┘
                    ↓
    ┌───────────────────────────────────────┐
    │ Auto-refetch /combat/:id/status       │
    │ Nouvelle data: {enemies: [],          │
    │                player: {hp: 100}}     │
    └───────────────┬───────────────────────┘
                    ↓
    ┌───────────────────────────────────────┐
    │ combatInfo.enemies.value ← []         │
    │ combatInfo.player.value ← {hp:100}    │
    │ (Computed reactifs mis à jour)        │
    └───────────────┬───────────────────────┘
                    ↓
    ┌───────────────────────────────────────┐
    │ WATCHERS DÉTECTENT LE CHANGEMENT      │
    │                                       │
    │ watch(enemies.length) :               │
    │   0 === 0 ✅ && inCombat ✅           │
    │   → handleCombatEnd(victory=true)     │
    └───────────────┬───────────────────────┘
                    ↓
    ┌───────────────────────────────────────┐
    │ isCombatEndModalOpen = true           │
    │ gameStore.appendMessage("🏆")         │
    │ Modal s'affiche! 🎉                   │
    └───────────────────────────────────────┘
```

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

### Analyse du Code Existant

**État actuel dans `/apps/frontend/src/composables/useCombat.ts`:**

1. **Fonction `checkCombatVictory()` (ligne 186)**
   - Appelée depuis `processAttackResult()` (ligne 245)
   - Vérifie uniquement `result.combatEnd` du backend
   - Appelle `handleCombatEnd()` si data présente
   - **RUSTINE 1**: Cette vérification n'a aucun effet car le backend ne retourne jamais `combatEnd` actuellement

2. **Fonction `processAttackResult()` (ligne 207)**
   - Construit `currentAttackView` depuis `combatState`
   - Appelle `checkCombatVictory(result)` en fin
   - **RUSTINE 2**: Le state update arrive via `combatApi.attack.mutateAsync()` qui invalide la query `status` → TanStack Query refetch auto
   - Donc les données de `combatInfo.enemies` et `combatInfo.player` se mettent à jour AUTOMATIQUEMENT en arrière-plan

3. **Données mises à jour par TanStack Query**
   - `combatApi.status` refetch automatiquement après chaque mutation via `onSuccess`
   - `combatInfo.enemies` = computed depuis `combatStatus.value?.enemies`
   - `combatInfo.player` = computed depuis `combatStatus.value?.player`

**Code à supprimer:**
- ❌ `checkCombatVictory()` → Plus besoin car les watchers détectent via data updated
- ❌ L'appel à `checkCombatVictory(result)` ligne 245 → Remplacé par les watchers
- ❌ Ne pas supprimer `handleCombatEnd()` → Utilisé par les watchers ET potentiellement par backend futur

---

### Étape 1: Ajouter Watchers dans `useCombat.ts`

**Fichier**: `apps/frontend/src/composables/useCombat.ts`

Ajouter les watchers **après** l'initialisation des variables (avant le `return`)

```typescript
import { watch } from "vue";

export function useCombat() {
  const combatInfo = useCombatInfo();
  const combatStore = useCombatStore();
  
  // ... existing code ...
  
  // Flag to prevent double trigger (Watcher + Backend combatEnd)
  let isCombatEndTriggered = false;

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
      if (inCombat && enemyCount === 0 && !isCombatEndTriggered) {
        isCombatEndTriggered = true;
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
      if (inCombat && playerHp <= 0 && !isCombatEndTriggered) {
        isCombatEndTriggered = true;
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

---

### Étape 2: Mettre à jour `closeCombatEndModal()`

**Fichier**: `apps/frontend/src/composables/useCombat.ts` (ligne 315)

```typescript
// Avant
const closeCombatEndModal = async () => {
  const c = currentCharacter.value;
  if (!c?.characterId) return;

  isCombatEndModalOpen.value = false;
  combatStore.clearCombat();
  await router.push({
    name: "game",
    params: { characterId: c.characterId },
  });
};

// Après - AJOUTER le reset du flag
const closeCombatEndModal = async () => {
  const c = currentCharacter.value;
  if (!c?.characterId) return;

  isCombatEndModalOpen.value = false;
  isCombatEndTriggered = false;  // ← AJOUTER CETTE LIGNE
  combatStore.clearCombat();
  await router.push({
    name: "game",
    params: { characterId: c.characterId },
  });
};
```

---

### Étape 3: SUPPRIMER code inutile

**Fichier**: `apps/frontend/src/composables/useCombat.ts`

❌ **À SUPPRIMER (ligne 186-192):**
```typescript
// SUPPRIMER CE BLOC ENTIER
const checkCombatVictory = (result: CombatActionResponseDto): void => {
  // First check if backend returned explicit combatEnd
  if (!result.combatEnd) return;
  void handleCombatEnd(
    result.combatEnd.victory,
    result.combatEnd.xp_gained,
    result.combatEnd.enemies_defeated,
    result.narrative!,
  );
};
```

❌ **À SUPPRIMER (ligne 245 dans `processAttackResult()`):**
```typescript
// SUPPRIMER CET APPEL
checkCombatVictory(result);
```

**Raison**: Ces deux éléments n'avaient aucun effet car `result.combatEnd` était toujours `undefined` (le backend ne le retourne pas). Les watchers remplacent cette logique par une détection automatique via les données mises à jour.

**Status**: 🟢 Ready to implement (code rustine identifié)  
**Priorité**: 🔴 High (bloque UX victoire)  
**Complexité**: 🟢 Low (watchers simples, suppression rustine)

---

## ⚠️ Notes d'Implémentation

### 1. Flag `isCombatEndTriggered` en variable locale

✅ **Pourquoi PAS dans `combatStore`**:
- Le flag n'est jamais lu depuis l'interface
- Uniquement utilisé dans `useCombat` pour éviter double trigger
- Scope local = plus simple et performant

### 2. Watchers avec debounce implicite

✅ **Pas besoin de `debounce` manuel** car:
- TanStack Query deduplique automatiquement les requêtes
- Les watchers se déclenchent une seule fois par update
- L'update vient via `combatInfo` (computed reactif)

### 3. Ordre d'exécution des watchers

✅ **Les deux watchers peuvent s'exécuter simultanément**:
- Cas rare: joueur tue dernier ennemi ET joueur meurt
- Flag `isCombatEndTriggered` le prévient
- Première condition vraie → set flag → deuxième condition false

### 4. Reset du flag nécessaire

✅ **Pourquoi reset dans `closeCombatEndModal()`**:
- L'utilisateur peut lancer un nouveau combat
- Le flag doit être prêt pour la prochaine fin
- `clearCombat()` supprime pas le flag local

### 5. Données non-déterministes

✅ **Si le backend implémente `combatEnd` plus tard**:
```typescript
// Option 1: Watchers + Backend explicit (coexistent)
if (result.combatEnd) {
  // Backend gave us XP/narrative
  void handleCombatEnd(result.combatEnd.victory, ...);
  isCombatEndTriggered = true;  // Flag prevent watcher
}

// Option 2: Watcher détecte aussi
// Les deux peuvent coexister → flag prévient double trigger
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

### Implémentation (Atomic PR)

1. **[2min]** Ajouter `isCombatEndTriggered` flag et les 2 watchers dans `useCombat.ts` (avant `return`)
2. **[1min]** Mettre à jour `closeCombatEndModal()` pour reset le flag
3. **[3min]** Supprimer `checkCombatVictory()` et son appel dans `processAttackResult()`
4. **[3min]** Tester manuellement:
   - Combat victoire: 1 ennemi meurt → modale apparaît 1x
   - Combat défaite: joueur prend dégâts → modale apparaît 1x si HP ≤ 0
   - Type-check: `npm run type-check` ✅
   - Console: aucune erreur
5. **[2min]** Commit + PR

**Total**: ~10-15 minutes

---

### Checklist Avant Commit

- [ ] Watchers ajoutés et testés
- [ ] `isCombatEndTriggered` flag fonctionne
- [ ] `checkCombatVictory()` supprimée
- [ ] Son appel supprimé de `processAttackResult()`
- [ ] `closeCombatEndModal()` reset le flag
- [ ] `npm run type-check` passe ✅
- [ ] Pas de console errors
- [ ] Modale victoire s'affiche une seule fois
- [ ] Modale défaite s'affiche une seule fois
- [ ] Navigation correcte après fermeture

---

## � Comparaison Avant/Après

### AVANT (Actuel)

```
processAttackResult()
  ↓
  → checkCombatVictory(result) 
    → Vérifie result.combatEnd (toujours undefined)
    → N'a AUCUN EFFET ❌
  
  → combatInfo.enemies/player 
    → Se mettent à jour via TanStack Query (refetch auto)
    → IGNORÉES 😞
  
RÉSULTAT: Modale ne s'affiche jamais
```

### APRÈS (Avec watchers)

```
processAttackResult()
  ↓
  → Les appels API mettent à jour combatInfo via TanStack
  → Watchers DÉTECTENT le changement
  → checkCombatVictory() supprimée ❌
  ↓
  watch(enemies.length, inCombat)
    → Si enemyCount === 0 && inCombat → handleCombatEnd(victory=true)
  
  watch(playerHp, inCombat)
    → Si playerHp <= 0 && inCombat → handleCombatEnd(victory=false)
  
RÉSULTAT: Modale s'affiche automatiquement ✅
```

### Avantages

| Aspect | Avant | Après |
|--------|-------|-------|
| **Détection** | ❌ Cassée | ✅ Automatique |
| **Code rustine** | ❌ `checkCombatVictory()` | ✅ Supprimée |
| **Latence** | N/A | +0ms (déjà refetch) |
| **Maintenance** | ❌ Fragile | ✅ 1 endroit (watchers) |
| **Double trigger** | ❌ N/A | ✅ Flag prévient |
| **Évolutivité** | ❌ Limité | ✅ Prêt multijoueur |

---

## 🔍 Visualisation du Code Avant/Après

### AVANT (Actuellement Cassé ❌)

```typescript
// useCombat.ts ligne 186
const checkCombatVictory = (result: CombatActionResponseDto): void => {
  if (!result.combatEnd) return;  // Toujours undefined → RETURN IMMÉDIATEMENT
  void handleCombatEnd(...);      // N'est JAMAIS exécuté
};

// Ligne 245 dans processAttackResult()
const processAttackResult = async (...) => {
  // ... animations ...
  checkCombatVictory(result);  // ← Appelée mais n'a aucun effet
};

RÉSULTAT: Modale ne s'affiche jamais 💀
```

### APRÈS (Avec Watchers ✅)

```typescript
// useCombat.ts avant return
let isCombatEndTriggered = false;

// Watcher 1: Détecter victoire
watch(
  () => ({ enemyCount: combatInfo.enemies.value.length, inCombat: combatInfo.inCombat.value }),
  ({ enemyCount, inCombat }) => {
    if (inCombat && enemyCount === 0 && !isCombatEndTriggered) {
      isCombatEndTriggered = true;
      void handleCombatEnd(true, 0, [...], "Victoire!");
    }
  },
);

// Watcher 2: Détecter défaite
watch(
  () => ({ playerHp: combatInfo.player.value?.hp ?? 0, inCombat: combatInfo.inCombat.value }),
  ({ playerHp, inCombat }) => {
    if (inCombat && playerHp <= 0 && !isCombatEndTriggered) {
      isCombatEndTriggered = true;
      void handleCombatEnd(false, 0, [], "Vaincu...");
    }
  },
);

// Ligne 245: SUPPRIMÉE
// checkCombatVictory(result);  ← À SUPPRIMER

// closeCombatEndModal: MISE À JOUR
const closeCombatEndModal = async () => {
  isCombatEndModalOpen.value = false;
  isCombatEndTriggered = false;  // ← Reset pour prochain combat
  combatStore.clearCombat();
  await router.push(...);
};

RÉSULTAT: Modale s'affiche automatiquement 🎉
```

---

## ❌ Code à Supprimer

### Suppression 1: Fonction inutile

**Fichier**: `apps/frontend/src/composables/useCombat.ts` (ligne ~186)

```typescript
// SUPPRIMER ENTIÈREMENT CE BLOC
const checkCombatVictory = (result: CombatActionResponseDto): void => {
  // First check if backend returned explicit combatEnd
  if (!result.combatEnd) return;
  void handleCombatEnd(
    result.combatEnd.victory,
    result.combatEnd.xp_gained,
    result.combatEnd.enemies_defeated,
    result.narrative!,
  );
};
```

**Pourquoi**: 
- Vérifiait `result.combatEnd` qui était toujours `undefined`
- Les watchers remplacent cette détection
- Fonction morte qui n'avait aucun effet

### Suppression 2: Appel à la fonction

**Fichier**: `apps/frontend/src/composables/useCombat.ts` (ligne ~245 dans `processAttackResult()`)

**Avant**:
```typescript
const processAttackResult = async (result: CombatActionResponseDto, target: CombatantDto) => {
  // ... code ...
  await showPlayerAttackAnimation(result);
  displayAttackResultMessage(target, result);
  checkCombatVictory(result);  // ← SUPPRIMER CETTE LIGNE
};
```

**Après**:
```typescript
const processAttackResult = async (result: CombatActionResponseDto, target: CombatantDto) => {
  // ... code ...
  await showPlayerAttackAnimation(result);
  displayAttackResultMessage(target, result);
  // Watchers detectent automatiquement la fin du combat
};
```

**Pourquoi**:
- L'appel n'avait aucun effet (fonction ne faisait rien)
- Les données sont mises à jour par TanStack Query
- Les watchers détectent automatiquement les changements

---

## 🔮 Améliorations Futures (Backend)

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
