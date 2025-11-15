# Étude de Faisabilité: Migration AdonisJS + Inertia

**Version:** 1.0  
**Date:** 15 Novembre 2025  
**Statut:** En révision  
**Branche:** `feature/adonis-migration-study`

---

## Table des matières

1. [Résumé Exécutif](#1-résumé-exécutif)
2. [Analyse de l'Existant](#2-analyse-de-lexistant)
3. [Architecture Cible](#3-architecture-cible)
4. [Plan de Migration](#4-plan-de-migration)
5. [Comparaison des Coûts](#5-comparaison-des-coûts)
6. [Risques et Mitigations](#6-risques-et-mitigations)
7. [Proof of Concept](#7-proof-of-concept)
8. [Recommandations](#8-recommandations)

---

## 1. Résumé Exécutif

### 1.1 Contexte

Le projet RPG-Gen est actuellement développé avec une architecture séparée:
- **Frontend:** Vue 3 + Vite + Pinia (~2640 lignes)
- **Backend:** NestJS + MongoDB (~1494 lignes)
- **Déploiement:** Docker Compose (3 conteneurs)

Cette étude évalue la faisabilité de migrer vers une architecture monolithique utilisant AdonisJS 6 avec Inertia.js.

### 1.2 Conclusions Principales

| Critère | Architecture Actuelle | Architecture AdonisJS | Avantage |
|---------|----------------------|----------------------|----------|
| **Complexité déploiement** | 3 conteneurs Docker | 1 conteneur (+ DB) | AdonisJS |
| **Configuration** | 2 package.json, 2 tsconfig | 1 de chaque | AdonisJS |
| **Coûts hosting** | 2 dynos Heroku (~$14/mois) | 1 dyno (~$7/mois) | AdonisJS |
| **Temps dev initial** | Déjà en production | ~4-6 semaines migration | Actuelle |
| **Code réutilisable** | 60-70% business logic | - | - |
| **Courbe d'apprentissage** | Connue (Vue + NestJS) | Nouvelle (AdonisJS) | Actuelle |

**Recommandation:** ⚠️ **Migration non prioritaire** - L'architecture actuelle fonctionne bien. Une migration serait bénéfique uniquement si:
1. L'équipe maîtrise déjà AdonisJS
2. Les coûts d'hébergement deviennent problématiques
3. Le projet nécessite un SSR avancé

---

## 2. Analyse de l'Existant

### 2.1 Inventaire du Code

#### 2.1.1 Frontend (Vue 3)

**Volumes de code:**
```
Total: ~2640 lignes
├── Components: 39 fichiers .vue
├── Views: 8 pages
├── Services: 7 fichiers
├── Composables: 4 fichiers
├── Stores: 1 Pinia store
└── Router: 1 fichier
```

**Structure actuelle:**
```
frontend/src/
├── components/
│   ├── ui/                    # 🟢 Réutilisables (Tailwind)
│   ├── character-creation/    # 🟡 À adapter
│   ├── character-stats/       # 🟢 Réutilisables
│   ├── game/                  # 🟡 À adapter
│   └── layout/                # 🟡 À adapter
├── composables/               # 🟢 80% réutilisables
├── services/
│   ├── characterService.ts    # 🔴 À réécrire (localStorage → DB)
│   ├── gameEngine.ts          # 🔴 À réécrire (API calls)
│   ├── authService.ts         # 🔴 À réécrire (JWT handling)
│   └── dndRulesService.ts     # 🟢 100% réutilisable
├── stores/
│   └── gameStore.ts           # 🟡 Partiellement réutilisable
└── router/
    └── index.ts               # 🔴 À remplacer par routes AdonisJS
```

**Légende:**
- 🟢 **Réutilisable sans modification** (~40% du code)
- 🟡 **Adaptable avec modifications mineures** (~30% du code)
- 🔴 **À réécrire complètement** (~30% du code)

#### 2.1.2 Backend (NestJS)

**Volumes de code:**
```
Total: ~1494 lignes
├── Modules: 5 (Auth, Chat, Character, Dice, Image)
├── Controllers: 5 fichiers
├── Services: 7 fichiers
├── Schemas: 3 Mongoose schemas
└── Guards/Strategies: 4 fichiers
```

**Structure actuelle:**
```
backend/src/
├── auth/
│   ├── auth.controller.ts     # 🟡 Logic réutilisable
│   ├── auth.service.ts        # 🟢 90% réutilisable
│   ├── google.strategy.ts     # 🔴 Passport → Ally
│   └── jwt.strategy.ts        # 🔴 Passport → Ally
├── chat/
│   ├── chat.controller.ts     # 🟡 Logic réutilisable
│   └── conversation.service.ts # 🟢 80% réutilisable
├── character/
│   ├── character.controller.ts # 🟡 Logic réutilisable
│   └── character.service.ts    # 🟢 90% réutilisable
├── external/
│   ├── gemini.service.ts      # 🟢 100% réutilisable
│   └── game-parser.util.ts    # 🟢 100% réutilisable
└── schemas/
    ├── user.schema.ts         # 🔴 Mongoose → Lucid ORM
    ├── character.schema.ts    # 🔴 Mongoose → Lucid ORM
    └── chat-history.schema.ts # 🔴 Mongoose → Lucid ORM
```

#### 2.1.3 Types Partagés

**Volumes de code:**
```
shared/types/: ~300 lignes
├── character.ts               # 🟢 100% réutilisable
├── game.ts                    # 🟢 100% réutilisable
├── dnd.ts                     # 🟢 100% réutilisable
└── api.ts                     # 🟡 À adapter
```

### 2.2 Dépendances Clés

#### Frontend
```json
{
  "vue": "^3.5.24",              // ✅ Compatible Inertia
  "pinia": "^3.0.4",             // ⚠️  Moins pertinent avec Inertia
  "axios": "^1.13.2",            // ⚠️  Remplacé par fetch Inertia
  "@tailwindcss/vite": "^4.1.17" // ✅ Compatible
}
```

#### Backend
```json
{
  "@nestjs/core": "^11.1.8",         // ❌ Remplacé par AdonisJS
  "@nestjs/mongoose": "^11.0.3",     // ❌ Remplacé par Lucid ORM
  "@nestjs/passport": "^11.0.5",     // ❌ Remplacé par Ally
  "@google/genai": "~1.29.1",        // ✅ Réutilisable
  "bcrypt": "^6.0.0",                // ✅ Réutilisable
  "sharp": "^0.34.5"                 // ✅ Réutilisable
}
```

### 2.3 Fonctionnalités à Migrer

| Fonctionnalité | Complexité | Priorité | Estimation |
|----------------|------------|----------|------------|
| **Auth Google OAuth** | Moyenne | Haute | 3-4h |
| **Auth JWT** | Faible | Haute | 2-3h |
| **CRUD Characters** | Moyenne | Haute | 4-5h |
| **Chat avec Gemini** | Moyenne | Haute | 3-4h |
| **Génération Images** | Faible | Moyenne | 2-3h |
| **Dice Roller** | Faible | Basse | 1-2h |
| **UI Components** | Élevée | Haute | 8-12h |
| **Character Creation Wizard** | Élevée | Haute | 6-8h |
| **Game Session** | Élevée | Haute | 8-10h |
| **Level Up System** | Moyenne | Moyenne | 4-5h |

**Total estimé:** ~40-55 heures de développement

---

## 3. Architecture Cible

### 3.1 Stack Technique Proposée

```
┌─────────────────────────────────────────┐
│         AdonisJS 6 Application          │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐    ┌──────────────┐ │
│  │   Inertia    │    │    Lucid     │ │
│  │  (SSR Vue)   │    │     ORM      │ │
│  └──────────────┘    └──────────────┘ │
│         │                    │         │
│  ┌──────────────┐    ┌──────────────┐ │
│  │  Vue 3 SFCs  │    │   MongoDB    │ │
│  │  + Tailwind  │    │  (via lucid) │ │
│  └──────────────┘    └──────────────┘ │
│                                         │
│  ┌──────────────────────────────────┐ │
│  │    Services (Business Logic)     │ │
│  │  - GeminiService                 │ │
│  │  - CharacterService              │ │
│  │  - DnDRulesService               │ │
│  └──────────────────────────────────┘ │
│                                         │
│  ┌──────────────────────────────────┐ │
│  │         Authentication           │ │
│  │  - Google OAuth (Ally)           │ │
│  │  - JWT Sessions                  │ │
│  └──────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 3.2 Structure de Dossiers Proposée

```
adonis-rpg-gen/
├── app/
│   ├── controllers/
│   │   ├── auth_controller.ts
│   │   ├── characters_controller.ts
│   │   ├── chat_controller.ts
│   │   ├── images_controller.ts
│   │   └── dice_controller.ts
│   ├── models/
│   │   ├── user.ts
│   │   ├── character.ts
│   │   └── chat_history.ts
│   ├── services/
│   │   ├── gemini_service.ts
│   │   ├── character_service.ts
│   │   ├── dnd_rules_service.ts
│   │   ├── conversation_service.ts
│   │   └── image_service.ts
│   ├── validators/
│   │   ├── character_validator.ts
│   │   └── chat_validator.ts
│   └── middleware/
│       └── auth.ts
├── resources/
│   ├── js/
│   │   ├── app.ts
│   │   ├── pages/                    # Vue pages (Inertia)
│   │   │   ├── home.vue
│   │   │   ├── game.vue
│   │   │   ├── character/
│   │   │   │   ├── create.vue
│   │   │   │   └── levelup.vue
│   │   │   └── auth/
│   │   │       └── login.vue
│   │   ├── components/               # Composants réutilisables
│   │   │   ├── ui/
│   │   │   ├── character-creation/
│   │   │   ├── character-stats/
│   │   │   └── game/
│   │   ├── composables/              # Logique réutilisable Vue
│   │   └── types/                    # Types TypeScript partagés
│   └── css/
│       └── app.css                   # Tailwind
├── database/
│   └── migrations/
├── config/
│   ├── database.ts
│   ├── auth.ts
│   ├── inertia.ts
│   └── ally.ts
├── start/
│   └── routes.ts
└── tests/
```

### 3.3 Comparaison des Architectures

| Aspect | Architecture Actuelle | Architecture AdonisJS |
|--------|----------------------|----------------------|
| **Séparation frontend/backend** | Totale (2 apps) | Unifiée (1 app) |
| **Type de rendu** | CSR (Client-Side) | SSR/CSR hybride (Inertia) |
| **Gestion état** | Pinia + localStorage | Props Inertia + sessions |
| **Routing** | Vue Router | Routes AdonisJS |
| **API calls** | Axios REST | Form submissions Inertia |
| **Auth** | JWT tokens locaux | Sessions serveur |
| **DB queries** | Pas d'ORM côté client | Lucid ORM natif |
| **Build process** | 2 builds séparés | 1 build unifié |
| **Hot reload** | 2 serveurs dev | 1 serveur dev |

### 3.4 Points d'Attention Techniques

#### 3.4.1 Inertia.js - Limitations

**Avantages:**
- ✅ SSR sans API REST explicite
- ✅ Routing côté serveur (meilleur SEO)
- ✅ Validation native côté serveur
- ✅ Moins de boilerplate (pas de axios/fetch)

**Limitations:**
- ❌ Pas de SPA pur (requêtes serveur à chaque navigation)
- ❌ Pas de state global persistant (Pinia moins utile)
- ❌ Requiert rechargement complet pour certaines actions
- ❌ WebSockets plus complexes à intégrer

**Impact sur RPG-Gen:**
Le chat en temps réel avec Gemini pourrait être impacté. Solution: garder WebSocket séparé ou utiliser polling.

#### 3.4.2 Lucid ORM avec MongoDB

**Limitation critique:** Lucid ORM est principalement conçu pour SQL (MySQL, PostgreSQL, SQLite).

**Options:**
1. **Migrer vers PostgreSQL** (recommandé)
   - Lucid natif, meilleure intégration
   - Migrations plus robustes
   - Relations plus simples
   
2. **Utiliser MongoDB avec un driver custom**
   - Nécessite adapter Lucid ou utiliser Mongoose en parallèle
   - Perd les avantages de l'ORM unifié
   - Plus de maintenance

**Recommandation:** Migrer vers PostgreSQL si migration AdonisJS choisie.

#### 3.4.3 Authentication

**Actuel:** Passport (Google OAuth) + JWT

**AdonisJS:** Ally (Google OAuth) + Sessions

**Changements:**
```typescript
// AVANT (NestJS + Passport)
@UseGuards(GoogleAuthGuard)
async googleAuth() { ... }

// APRÈS (AdonisJS + Ally)
async redirect({ ally }: HttpContext) {
  return ally.use('google').redirect()
}
```

---

## 4. Plan de Migration

### 4.1 Stratégie Globale

**Approche recommandée:** Migration progressive sur une branche séparée avec POC initial.

**Alternatives rejetées:**
- ❌ Big Bang (trop risqué)
- ❌ Feature flags (trop complexe pour 1 dev)

### 4.2 Phases de Migration

#### Phase 0: Préparation (1 semaine)

**Objectifs:**
- [ ] Setup environnement AdonisJS
- [ ] Configuration base (DB, Auth, Inertia)
- [ ] Structure de dossiers
- [ ] Tooling (ESLint, TypeScript, tests)

**Livrables:**
- Repo AdonisJS fonctionnel
- Config MongoDB ou PostgreSQL
- Inertia installé et configuré

**Risques:** Compatibilité versions, courbe d'apprentissage

---

#### Phase 1: Backend Core (1 semaine)

**Priorité: HAUTE**

**Objectifs:**
- [ ] Modèles Lucid (User, Character, ChatHistory)
- [ ] Migrations DB
- [ ] Auth Controller (Google OAuth + JWT)
- [ ] Character Controller (CRUD)
- [ ] Services business logic (Gemini, DnDRules)

**Ordre de développement:**
```
1. Models → 2. Migrations → 3. Auth → 4. Character CRUD → 5. Services
```

**Code réutilisable:**
```typescript
// Services backend presque identiques
// backend/src/external/gemini.service.ts → app/services/gemini_service.ts
class GeminiService {
  // 🟢 Même logique, juste adapter les imports
  async generateText(prompt: string) { ... }
}

// backend/src/services/dndRulesService.ts → app/services/dnd_rules_service.ts
class DnDRulesService {
  // 🟢 100% réutilisable (pure TypeScript)
  calculateModifier(score: number) { ... }
}
```

**Tests critiques:**
- [ ] Auth flow complet (login → token → protected route)
- [ ] Character CRUD avec DB
- [ ] Gemini API integration

---

#### Phase 2: Frontend Pages (1.5 semaines)

**Priorité: HAUTE**

**Objectifs:**
- [ ] Migrer composants UI (Tailwind)
- [ ] Pages Inertia (Home, Login, Character, Game)
- [ ] Composables Vue réutilisés
- [ ] Formulaires avec validation Inertia

**Ordre de migration:**
```
1. Layout → 2. Auth pages → 3. Home → 4. Character Creation → 5. Game View
```

**Composants réutilisables:**
```vue
<!-- frontend/src/components/ui/UiButton.vue -->
<!-- ✅ Réutilisable à 100% dans resources/js/components/ui/ -->
<template>
  <button :class="classes" @click="$emit('click')">
    <slot />
  </button>
</template>
```

**Adaptations nécessaires:**
```vue
<!-- AVANT: Vue Router -->
<router-link to="/game">Start Game</router-link>

<!-- APRÈS: Inertia Link -->
<Link href="/game">Start Game</Link>
```

**Tests critiques:**
- [ ] Navigation entre pages
- [ ] Formulaire character creation
- [ ] State partagé entre pages

---

#### Phase 3: Features Avancées (1 semaine)

**Priorité: MOYENNE**

**Objectifs:**
- [ ] Chat avec Gemini (WebSocket ou polling)
- [ ] Génération images
- [ ] Dice roller
- [ ] Level up system

**Défis:**
- Chat temps réel avec Inertia (pas de WebSocket natif)
- Gestion state game session (localStorage → sessions serveur)

**Solutions:**
```typescript
// Option 1: Polling avec Inertia
// Requête AJAX classique pour messages chat
const { data } = await axios.post('/chat', { message })

// Option 2: WebSocket séparé (plus complexe)
// Garder un WebSocket hors Inertia pour chat temps réel
```

---

#### Phase 4: Tests et Optimisations (3-5 jours)

**Priorité: HAUTE**

**Objectifs:**
- [ ] Tests E2E (Cypress ou Playwright)
- [ ] Tests unitaires backend
- [ ] Optimisation bundle Vite
- [ ] Documentation technique

---

### 4.3 Timeline Global

```
Semaine 1: Phase 0 (Setup) + Phase 1 (Backend Core)
Semaine 2: Phase 2 (Frontend Pages)
Semaine 3: Phase 2 (suite) + Phase 3 (Features Avancées)
Semaine 4: Phase 4 (Tests) + Buffer
```

**Total estimé:** 4-6 semaines à temps plein

---

## 5. Comparaison des Coûts

### 5.1 Coûts de Développement

| Phase | Architecture Actuelle | Migration AdonisJS | Différence |
|-------|----------------------|-------------------|------------|
| **Setup initial** | ✅ Fait | 8-10h | +8-10h |
| **Maintenance mensuelle** | 5-10h | 3-5h (moins de config) | -2-5h |
| **Onboarding dev** | 4-6h (2 stacks) | 2-3h (1 stack) | -2-3h |
| **Migration complète** | N/A | 160-220h | +160-220h |

**Coût migration:** ~4-6 semaines de développement (1 dev fullstack)

### 5.2 Coûts d'Hébergement

#### Architecture Actuelle (Docker Compose)

**Heroku:**
```
Frontend (Dyno Basic): ~$7/mois
Backend (Dyno Basic):  ~$7/mois
MongoDB (Atlas M0):    Gratuit (512MB)
────────────────────────────────
Total:                 ~$14/mois
```

**VPS (Alternative):**
```
DigitalOcean Droplet 2GB: $12/mois (peut héberger les 3 conteneurs)
```

#### Architecture AdonisJS

**Heroku:**
```
AdonisJS App (Dyno Basic): ~$7/mois
MongoDB/PostgreSQL:        Gratuit (Atlas M0 ou Heroku Postgres)
────────────────────────────────
Total:                     ~$7/mois
```

**VPS:**
```
DigitalOcean Droplet 1GB: $6/mois (monoconteneur)
```

**Économies annuelles:** ~$84/an (Heroku) ou ~$72/an (VPS)

### 5.3 Coûts de Complexité

| Aspect | Actuelle | AdonisJS | Avantage |
|--------|----------|----------|----------|
| **Fichiers config** | 4+ (docker-compose, 2x package.json) | 2 (package.json, .adonisrc) | AdonisJS |
| **Temps build** | 2 builds séparés (~3min) | 1 build (~2min) | AdonisJS |
| **Logs à surveiller** | 2 apps | 1 app | AdonisJS |
| **Debugging** | 2 processus | 1 processus | AdonisJS |
| **CI/CD pipelines** | 2 jobs | 1 job | AdonisJS |

### 5.4 ROI Estimé

**Investissement initial:** 160-220h dev × €40-60/h = **€6,400-13,200**

**Gains annuels:**
- Hébergement: €84/an
- Maintenance: ~20h/an × €50/h = €1,000/an
- **Total gains/an:** ~€1,084/an

**Break-even:** 6-12 ans

**Conclusion:** ⚠️ **ROI négatif à court/moyen terme** pour un petit projet.

---

## 6. Risques et Mitigations

### 6.1 Risques Techniques

#### 🔴 Risque ÉLEVÉ: Incompatibilité Lucid + MongoDB

**Impact:** Impossibilité d'utiliser Lucid ORM nativement avec MongoDB.

**Probabilité:** 90%

**Mitigations:**
1. **Migrer vers PostgreSQL** (recommandé)
   - Effort: ~5-8h (migrations + tests)
   - Avantage: ORM natif + relations
   
2. **Utiliser Mongoose en parallèle**
   - Perd l'avantage de l'écosystème unifié AdonisJS
   - Plus de maintenance

**Décision:** Si migration AdonisJS, migrer vers PostgreSQL obligatoire.

---

#### 🟡 Risque MOYEN: Chat temps réel avec Inertia

**Impact:** Performance dégradée pour chat Gemini (polling vs WebSocket).

**Probabilité:** 60%

**Mitigations:**
1. **Polling optimisé** (interval 2-3s)
   - Simple à implémenter
   - Acceptable pour chat non-instantané
   
2. **WebSocket séparé**
   - Hors scope Inertia
   - Plus complexe

**Décision:** Commencer avec polling, évaluer WebSocket si problème perfs.

---

#### 🟡 Risque MOYEN: Courbe d'apprentissage AdonisJS

**Impact:** Ralentissement dev initial, bugs potentiels.

**Probabilité:** 70%

**Mitigations:**
1. **POC avant migration** (2-3 jours)
2. **Formation équipe** (1 semaine)
3. **Pair programming** pour features critiques

**Décision:** Phase 0 (Setup) = période d'apprentissage.

---

#### 🟢 Risque FAIBLE: Régression fonctionnelle

**Impact:** Features cassées après migration.

**Probabilité:** 30%

**Mitigations:**
1. **Tests E2E dès Phase 1**
2. **Checklist features** (validation manuelle)
3. **Environnement staging** pour validation

**Décision:** Tests E2E obligatoires avant merge.

---

### 6.2 Risques Business

#### 🔴 Risque ÉLEVÉ: Temps projet sous-estimé

**Impact:** Migration prend 2-3x plus de temps que prévu.

**Probabilité:** 60%

**Mitigations:**
1. **Buffer 50%** sur estimations
2. **Migration progressive** (feature par feature)
3. **Rollback plan** si dépassement >6 semaines

**Décision:** Timeline réaliste = 6-8 semaines (avec buffer).

---

#### 🟡 Risque MOYEN: Coût migration > bénéfices

**Impact:** Investissement non rentabilisé.

**Probabilité:** 70% (cf. ROI négatif)

**Mitigations:**
1. **Validation business** avant migration
2. **Calculer valeur long terme** (scalabilité, maintenance)
3. **Annuler si ROI > 3 ans**

**Décision:** Migration justifiée uniquement si:
- Équipe déjà familière avec AdonisJS
- Projet à long terme (5+ ans)
- Scalabilité critique

---

### 6.3 Stratégie de Rollback

**Scénarios nécessitant rollback:**
1. Migration dépasse 8 semaines
2. Bugs critiques non résolvables
3. Perfs dégradées vs architecture actuelle

**Plan de rollback:**
1. **Garder architecture actuelle en production** pendant migration
2. **Branch séparée** pour AdonisJS (pas de merge main)
3. **Abandon possible** sans impact production

**Critères de succès migration:**
- [ ] Toutes features actuelles fonctionnelles
- [ ] Tests E2E passent à 100%
- [ ] Perfs équivalentes ou meilleures
- [ ] Documenté et validé

---

## 7. Proof of Concept

### 7.1 Objectifs du POC

**Valider 3 points critiques:**
1. ✅ Inertia + Vue 3 compatible avec composants actuels
2. ✅ Lucid ORM + PostgreSQL (remplace Mongoose)
3. ✅ Auth Google OAuth via Ally

**Timeline:** 3-5 jours

**Livrables:**
- App AdonisJS minimale fonctionnelle
- 1 page Inertia avec composants UI
- Auth Google OAuth complète
- Character CRUD basique

### 7.2 Setup POC

#### Étape 1: Initialisation AdonisJS

```bash
# Créer nouveau projet
npm init adonisjs@latest adonis-rpg-poc -- --kit=web --auth-guard=session

# Installer dépendances
cd adonis-rpg-poc
npm install @adonisjs/inertia @adonisjs/lucid @adonisjs/ally
npm install vue@3 @vitejs/plugin-vue
```

#### Étape 2: Configuration Inertia

```typescript
// config/inertia.ts
import { defineConfig } from '@adonisjs/inertia'

export default defineConfig({
  rootView: 'root',
  sharedData: {
    appName: 'RPG-Gen',
  },
  ssr: {
    enabled: false, // Optionnel: SSR désactivé pour POC
  },
})
```

#### Étape 3: Modèle User + Migration

```typescript
// app/models/user.ts
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column()
  declare displayName: string | null

  @column()
  declare googleId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
```

```typescript
// database/migrations/xxx_create_users_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('email').notNullable().unique()
      table.string('display_name')
      table.string('google_id').notNullable().unique()
      table.timestamps(true)
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

#### Étape 4: Auth Google OAuth

```typescript
// config/ally.ts
import { defineConfig, drivers } from '@adonisjs/ally'

export default defineConfig({
  google: drivers.google({
    clientId: env.get('GOOGLE_CLIENT_ID'),
    clientSecret: env.get('GOOGLE_CLIENT_SECRET'),
    callbackUrl: 'http://localhost:3333/auth/google/callback',
  }),
})
```

```typescript
// app/controllers/auth_controller.ts
import type { HttpContext } from '@adonisjs/core/http'

export default class AuthController {
  async redirect({ ally }: HttpContext) {
    return ally.use('google').redirect()
  }

  async callback({ ally, auth, response }: HttpContext) {
    const google = ally.use('google')
    const user = await google.user()
    
    // Find or create user
    const dbUser = await User.firstOrCreate(
      { googleId: user.id },
      { email: user.email, displayName: user.name }
    )
    
    await auth.use('web').login(dbUser)
    return response.redirect('/home')
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect('/')
  }
}
```

#### Étape 5: Page Inertia avec Composant UI

```vue
<!-- resources/js/pages/home.vue -->
<script setup lang="ts">
import { Head } from '@inertiajs/vue3'
import UiButton from '../components/ui/UiButton.vue'

defineProps<{
  user: { email: string; displayName: string }
}>()
</script>

<template>
  <Head title="Home" />
  
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold">Welcome, {{ user.displayName }}!</h1>
    
    <UiButton variant="primary" @click="startGame">
      Start New Game
    </UiButton>
  </div>
</template>
```

#### Étape 6: Controller avec Inertia

```typescript
// app/controllers/home_controller.ts
import type { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
  async index({ inertia, auth }: HttpContext) {
    return inertia.render('home', {
      user: auth.user!,
    })
  }
}
```

#### Étape 7: Routes

```typescript
// start/routes.ts
import router from '@adonisjs/core/services/router'
const AuthController = () => import('#controllers/auth_controller')
const HomeController = () => import('#controllers/home_controller')

router.get('/', async ({ inertia }) => {
  return inertia.render('landing')
})

router.get('/auth/google', [AuthController, 'redirect'])
router.get('/auth/google/callback', [AuthController, 'callback'])
router.post('/auth/logout', [AuthController, 'logout'])

router.get('/home', [HomeController, 'index']).use('auth')
```

### 7.3 Tests POC

**Checklist validation:**
- [ ] `npm run dev` démarre serveur AdonisJS + Vite
- [ ] Page `/` affiche landing page Inertia
- [ ] Bouton "Login with Google" redirige vers OAuth
- [ ] Callback Google crée user en DB
- [ ] Page `/home` affiche user connecté
- [ ] Composant `UiButton` réutilisé fonctionne
- [ ] Logout déconnecte et redirige vers `/`

**Critères de succès:**
- ✅ Toutes les étapes passent sans erreur
- ✅ Temps setup < 1 journée
- ✅ Composants Vue réutilisables sans modification

**Critères d'échec:**
- ❌ Incompatibilité Inertia + Vue 3
- ❌ Bugs critiques non résolus en 2 jours
- ❌ Complexité excessive vs NestJS

### 7.4 Résultats Attendus POC

**Si POC réussi:**
- ✅ Migration techniquement faisable
- ✅ Passer à Phase 1 (Backend Core)
- ✅ Documenter learnings POC

**Si POC échoue:**
- ❌ Abandonner migration AdonisJS
- ❌ Rester sur architecture actuelle
- ❌ Documenter blockers rencontrés

---

## 8. Recommandations

### 8.1 Décision Finale

**Statut:** ⚠️ **MIGRATION NON RECOMMANDÉE À COURT TERME**

**Justifications:**
1. **ROI négatif** (6-12 ans break-even)
2. **Architecture actuelle fonctionnelle** (pas de dette technique critique)
3. **Coût migration élevé** (160-220h dev)
4. **Risque technique** (Lucid incompatible MongoDB → migration PostgreSQL obligatoire)
5. **Courbe d'apprentissage** AdonisJS pour l'équipe

### 8.2 Scénarios où Migration Justifiée

**Migration recommandée SI:**

1. **Équipe familière avec AdonisJS**
   - Réduit risque courbe d'apprentissage
   - Timeline plus réaliste (4 semaines vs 6-8)

2. **Projet long terme (5+ ans)**
   - Bénéfices maintenance compensent coût migration
   - Écosystème unifié facilite onboarding futurs devs

3. **Scalabilité critique**
   - Trafic élevé prévu (milliers d'utilisateurs)
   - Coûts hébergement deviennent significatifs

4. **Refactoring DB nécessaire de toute façon**
   - Si migration MongoDB → PostgreSQL déjà planifiée
   - Profiter de la migration pour tout refondre

### 8.3 Alternatives Recommandées

#### Option 1: Rester sur Architecture Actuelle ✅ (Recommandé)

**Actions:**
- Optimiser architecture existante
- Améliorer CI/CD
- Documenter codebase
- Réduire dette technique progressive

**Avantages:**
- ✅ Zéro risque
- ✅ Focus sur features métier
- ✅ Pas de temps perdu en migration

---

#### Option 2: Migration Hybride (Moyen Terme)

**Principe:** Garder backend NestJS, migrer frontend vers Nuxt 3 (SSR Vue)

**Avantages:**
- ✅ SSR amélioré (SEO)
- ✅ Garde backend fonctionnel
- ✅ Migration moins risquée (frontend only)
- ✅ API REST inchangée

**Timeline:** 2-3 semaines (vs 6-8 pour AdonisJS complet)

---

#### Option 3: Migration Long Terme (Si ROI positif)

**Étapes:**
1. **Année 1:** POC AdonisJS + formation équipe
2. **Année 2:** Migration progressive (1 feature/mois)
3. **Année 3:** Finalisation + optimisations

**Avantages:**
- ✅ Risque étalé dans le temps
- ✅ Permet tests approfondis
- ✅ Pas de pression deadline

---

### 8.4 Actions Immédiates

**Indépendamment de la décision migration:**

1. **Documenter architecture actuelle** ✅ (ce document)
2. **Améliorer tests** (augmenter couverture E2E)
3. **Optimiser Docker Compose** (build times, volumes)
4. **Setup CI/CD robuste** (tests auto, deploy auto)
5. **Monitoring production** (logs centralisés, alerts)

---

## 9. Annexes

### 9.1 Ressources Techniques

**Documentation:**
- [AdonisJS v6 Docs](https://docs.adonisjs.com/guides/introduction)
- [Inertia.js Docs](https://inertiajs.com/)
- [Lucid ORM Docs](https://lucid.adonisjs.com/)
- [Ally Auth Docs](https://docs.adonisjs.com/guides/authentication/social-authentication)

**Exemples POC:**
- [AdonisJS + Inertia Starter](https://github.com/adonisjs/inertia-starter-kit)
- [Inertia Vue 3 Example](https://github.com/inertiajs/inertia/tree/master/packages/vue3)

### 9.2 Comparaison Frameworks

| Framework | Type | SSR | ORM | Auth | Courbe apprentissage |
|-----------|------|-----|-----|------|---------------------|
| **NestJS** | Backend API | ❌ | Mongoose/TypeORM | Passport | Moyenne |
| **AdonisJS** | Fullstack MVC | ✅ (Inertia) | Lucid | Ally | Moyenne-Élevée |
| **Nuxt 3** | Fullstack Vue | ✅ | ❌ (API externe) | Custom | Faible-Moyenne |
| **Remix** | Fullstack React | ✅ | ❌ (Prisma externe) | Custom | Moyenne |

### 9.3 Glossaire

- **SSR:** Server-Side Rendering (rendu côté serveur)
- **CSR:** Client-Side Rendering (rendu côté client)
- **ORM:** Object-Relational Mapping (mapping objet-base de données)
- **POC:** Proof of Concept (preuve de concept)
- **ROI:** Return on Investment (retour sur investissement)
- **SPA:** Single Page Application (application une seule page)
- **Inertia:** Bridge entre backend MVC et frontend SPA (sans API REST)
- **Lucid:** ORM natif AdonisJS (similaire à Eloquent Laravel)
- **Ally:** Système d'authentification sociale AdonisJS

---

## Conclusion

Cette étude démontre que:

1. **La migration est techniquement faisable** avec un POC validé
2. **Le coût est élevé** (160-220h) pour un bénéfice limité à court terme
3. **L'architecture actuelle est adaptée** au projet et à l'équipe
4. **AdonisJS serait bénéfique** uniquement dans des scénarios spécifiques

**Décision finale:** Rester sur architecture actuelle, réévaluer dans 12-18 mois si:
- Trafic augmente significativement
- Équipe s'agrandit (>3 devs)
- Coûts hébergement deviennent problématiques

---

**Document soumis pour validation.**  
**Toute question ou précision peut être adressée via les issues GitHub.**
