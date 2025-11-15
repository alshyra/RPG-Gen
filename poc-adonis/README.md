# Proof of Concept - AdonisJS Migration

Ce dossier contient les fichiers de démonstration pour le POC de migration AdonisJS + Inertia.

## Structure

```
poc-adonis/
├── README.md                           # Ce fichier
├── examples/
│   ├── models/
│   │   └── user.example.ts            # Exemple modèle Lucid
│   ├── controllers/
│   │   ├── auth_controller.example.ts # Exemple auth avec Ally
│   │   └── home_controller.example.ts # Exemple controller Inertia
│   ├── pages/
│   │   └── home.example.vue           # Exemple page Inertia
│   └── migrations/
│       └── users_table.example.ts     # Exemple migration Lucid
└── setup-commands.sh                   # Commandes setup POC
```

## Instructions POC

### 1. Setup Initial (1-2h)

```bash
# Créer nouveau projet AdonisJS
npm init adonisjs@latest adonis-rpg-poc -- --kit=web --auth-guard=session

cd adonis-rpg-poc

# Installer dépendances
npm install @adonisjs/inertia @adonisjs/lucid @adonisjs/ally
npm install vue@3 @vitejs/plugin-vue @inertiajs/vue3

# Installer PostgreSQL (ou utiliser Docker)
# docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=secret postgres:16
```

### 2. Configuration (30min)

```bash
# Configurer Inertia
node ace configure @adonisjs/inertia

# Configurer Lucid (PostgreSQL)
node ace configure @adonisjs/lucid

# Configurer Ally (Google OAuth)
node ace configure @adonisjs/ally
```

### 3. Développement (2-3h)

- Copier les exemples depuis `examples/` vers le projet AdonisJS
- Adapter les imports et namespaces
- Créer les migrations: `node ace migration:run`
- Tester l'auth Google OAuth
- Valider Inertia + Vue 3

### 4. Validation (30min)

**Checklist:**
- [ ] Serveur démarre avec `npm run dev`
- [ ] Page landing affichée
- [ ] Auth Google fonctionne
- [ ] User créé en DB (PostgreSQL)
- [ ] Navigation Inertia sans erreurs
- [ ] Composants Vue réutilisés

## Temps Estimé Total

**3-5 jours** incluant:
- Setup environnement (1 jour)
- Développement (2 jours)
- Tests et debugging (1-2 jours)

## Critères de Succès

✅ **POC réussi si:**
- Toutes les étapes de validation passent
- Composants UI réutilisables sans modification majeure
- Temps développement < 5 jours

❌ **POC échoué si:**
- Bugs critiques non résolus en 2 jours
- Incompatibilité Inertia + Vue 3
- Complexité excessive vs architecture actuelle

## Résultats Attendus

Si le POC est réussi, il valide:
1. Faisabilité technique de la migration
2. Compatibilité des composants Vue existants
3. Courbe d'apprentissage acceptable (< 1 semaine)

Ces résultats seront documentés dans `docs/MIGRATION_STUDY.md` section 7.4.

## Prochaines Étapes

**Si POC réussi:**
→ Passer à Phase 1 (Backend Core) du plan de migration

**Si POC échoué:**
→ Abandonner migration AdonisJS, rester sur architecture actuelle

---

**Note:** Ce POC doit être réalisé sur une branche séparée et ne doit pas impacter la production.
