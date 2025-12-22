# 🎯 Prompt de Migration : Clean Architecture pour RPG-Gen Backend

## 📋 État actuel du projet

### Architecture actuelle
```
apps/backend/src/
├── controllers/          # Controllers NestJS (OK)
├── domain/              # Services métier + DTOs (⚠️ mélangés)
│   ├── auth/
│   ├── character/
│   ├── chat/
│   ├── classes/
│   ├── combat/
│   ├── dice/
│   ├── image/
│   ├── item-definition/
│   └── spell-definition/
├── infra/               # Infrastructure (OK)
│   ├── external/        # Services externes (Gemini)
│   └── mongo/          # Schemas MongoDB
├── orchestrators/       # Orchestration (OK)
└── modules/            # Modules NestJS (OK)
```

### Problèmes identifiés

1. **DTOs couplés aux documents MongoDB**
   ```typescript
   // ❌ BaseCharacterResponseDto.ts
   export class BaseCharacterResponseDto {
     // accepte CharacterDocument en paramètre
   }
   ```

2. **Pas d'entités métier pures**
   - Logique métier dans `CharacterService`
   - Règles de validation dispersées entre DTOs et services
   - Pas de séparation claire entre domaine et infrastructure

3. **Services trop larges**
   - `CharacterService` : 500+ lignes, fait tout
   - Gère à la fois la persistance ET la logique métier
   - Difficile à tester unitairement

## 🎯 Architecture cible

### Structure proposée
```
apps/backend/src/
├── domain/
│   ├── character/
│   │   ├── entities/
│   │   │   └── Character.ts              # ✨ Entité métier pure
│   │   ├── value-objects/
│   │   │   ├── CharacterStats.ts         # ✨ Value Object
│   │   │   ├── ResourcePool.ts           # ✨ PA/PM
│   │   │   └── TalentRank.ts            # ✨ Progression talents
│   │   ├── repositories/
│   │   │   └── ICharacterRepository.ts   # ✨ Interface abstraite
│   │   └── services/
│   │       └── CharacterDomainService.ts # ✨ Logique métier complexe
│   ├── combat/
│   │   ├── entities/
│   │   │   ├── CombatSession.ts         # ✨ Entité combat
│   │   │   └── Combatant.ts             # ✨ Value Object
│   │   └── repositories/
│   │       └── ICombatRepository.ts
│   └── [autres domaines...]
│
├── application/
│   ├── character/
│   │   ├── use-cases/
│   │   │   ├── CreateCharacterDraft.ts
│   │   │   ├── CompleteCharacter.ts
│   │   │   ├── LevelUpCharacter.ts
│   │   │   └── ApplyDamage.ts
│   │   └── CharacterAppService.ts        # ✨ Orchestration use cases
│   └── [autres applications...]
│
├── infrastructure/
│   ├── persistence/
│   │   ├── mongo/
│   │   │   ├── schemas/
│   │   │   │   └── CharacterDocument.ts   # Schema Mongoose
│   │   │   ├── repositories/
│   │   │   │   └── MongoCharacterRepository.ts  # ✨ Impl repository
│   │   │   └── mappers/
│   │   │       └── CharacterMapper.ts     # ✨ Document ↔ Entity
│   │   └── [autres persistences...]
│   └── external/
│       └── gemini/                        # Services externes (OK)
│
├── api/
│   ├── character/
│   │   ├── dto/
│   │   │   ├── request/
│   │   │   │   ├── CreateCharacterDto.ts
│   │   │   │   └── UpdateCharacterDto.ts
│   │   │   ├── response/
│   │   │   │   ├── CharacterResponseDto.ts
│   │   │   │   └── DraftCharacterResponseDto.ts
│   │   │   └── mappers/
│   │   │       └── CharacterDtoMapper.ts  # ✨ Entity ↔ DTO
│   │   └── CharacterController.ts
│   └── [autres APIs...]
│
└── modules/                               # Modules NestJS (OK)
```

## 📝 Plan de migration détaillé

### Phase 1 : Domain Layer - Character (Prioritaire)

**Étape 1.1 : Value Objects**

Créer `apps/backend/src/domain/character/value-objects/CharacterStats.ts` :

```typescript
export class CharacterStats {
  constructor(
    public readonly vigor: number,
    public readonly finesse: number,
    public readonly mind: number,
    public readonly survival: number,
  ) {
    this.validate();
  }

  private validate(): void {
    const stats = [this.vigor, this.finesse, this.mind, this.survival];
    if (stats.some(s => s < 0)) {
      throw new Error('Stats cannot be negative');
    }
  }

  getTotalPoints(): number {
    return this.vigor + this.finesse + this.mind + this.survival;
  }

  // Calculs dérivés
  getVigorModifier(): number {
    return Math.floor(this.vigor / 2);
  }

  // Immutabilité
  withVigor(newVigor: number): CharacterStats {
    return new CharacterStats(newVigor, this.finesse, this.mind, this.survival);
  }
}
```

Créer `apps/backend/src/domain/character/value-objects/ResourcePool.ts` :

```typescript
export class ResourcePool {
  constructor(
    public readonly current: number,
    public readonly max: number,
  ) {
    if (current > max) throw new Error('Current exceeds max');
    if (current < 0 || max < 0) throw new Error('Values cannot be negative');
  }

  spend(amount: number): ResourcePool {
    if (amount > this.current) throw new Error('Insufficient resources');
    return new ResourcePool(this.current - amount, this.max);
  }

  restore(): ResourcePool {
    return new ResourcePool(this.max, this.max);
  }

  isEmpty(): boolean {
    return this.current === 0;
  }

  isFull(): boolean {
    return this.current === this.max;
  }
}
```

Créer `apps/backend/src/domain/character/value-objects/TalentRank.ts` :

```typescript
export class TalentRank {
  constructor(
    public readonly voieId: string,
    public readonly rank: number, // 1-5
  ) {
    if (rank < 1 || rank > 5) {
      throw new Error('Rank must be between 1 and 5');
    }
  }

  canUnlockNext(): boolean {
    return this.rank < 5;
  }

  unlockNext(): TalentRank {
    if (!this.canUnlockNext()) {
      throw new Error('Maximum rank reached');
    }
    return new TalentRank(this.voieId, this.rank + 1);
  }
}
```

**Étape 1.2 : Entité Character**

Créer `apps/backend/src/domain/character/entities/Character.ts` :

```typescript
export type ClassName = 'guerrier' | 'rogue' | 'mage';
export type RaceId = 'humain' | 'nain' | 'elfe' | 'dark_elfe' | 'orc';
export type CharacterState = 'draft' | 'created';

export interface CharacterProps {
  // Identité
  characterId: string;
  userId?: string;
  name?: string;
  physicalDescription?: string;
  portrait?: string;
  gender?: string;
  
  // Système de jeu
  state: CharacterState;
  className?: ClassName;
  raceId?: RaceId;
  level: number;
  
  // Stats & ressources
  stats?: CharacterStats;
  hp: number;
  hpMax: number;
  pa: number;
  paMax: number;
  pm: number;
  pmMax: number;
  
  // Progression
  totalXp: number;
  inspirationPoints: number;
  talentPoints: number;
  unlockedRanks: TalentRank[];
  aptitudes: CharacterAptitude[];
  
  // Inventaire & état
  inventory: InventoryItem[];
  spells: Spell[];
  isDeceased: boolean;
  diedAt?: Date;
  deathLocation?: string;
}

export interface CharacterAptitude {
  aptitudeId: string;
  currentCooldown: number;
}

export class Character {
  private constructor(private props: CharacterProps) {
    this.validate();
  }

  // === Factory Methods ===
  
  static createDraft(params: {
    characterId: string;
    userId?: string;
  }): Character {
    return new Character({
      characterId: params.characterId,
      userId: params.userId,
      state: 'draft',
      level: 1,
      hp: 0,
      hpMax: 0,
      pa: 6,
      paMax: 6,
      pm: 4,
      pmMax: 4,
      totalXp: 0,
      inspirationPoints: 1,
      talentPoints: 0,
      unlockedRanks: [],
      aptitudes: [],
      inventory: [],
      spells: [],
      isDeceased: false,
    });
  }

  static reconstitute(props: CharacterProps): Character {
    return new Character(props);
  }

  // === Validation ===
  
  private validate(): void {
    if (!this.props.characterId) {
      throw new Error('Character must have an ID');
    }
    
    if (this.props.level < 1 || this.props.level > 20) {
      throw new Error('Level must be between 1 and 20');
    }

    if (this.props.state === 'created') {
      this.validateComplete();
    }
  }

  private validateComplete(): void {
    const required: (keyof CharacterProps)[] = [
      'name', 'className', 'raceId', 'stats', 
      'portrait', 'gender', 'physicalDescription'
    ];
    
    for (const field of required) {
      if (!this.props[field]) {
        throw new Error(`Complete character missing: ${field}`);
      }
    }
  }

  // === Getters ===
  
  get id(): string { return this.props.characterId; }
  get userId(): string | undefined { return this.props.userId; }
  get name(): string | undefined { return this.props.name; }
  get state(): CharacterState { return this.props.state; }
  get isDraft(): boolean { return this.props.state === 'draft'; }
  get isComplete(): boolean { return this.props.state === 'created'; }
  get level(): number { return this.props.level; }
  get hp(): number { return this.props.hp; }
  get hpMax(): number { return this.props.hpMax; }
  get isAlive(): boolean { return !this.props.isDeceased; }
  get className(): ClassName | undefined { return this.props.className; }
  get raceId(): RaceId | undefined { return this.props.raceId; }
  get talentPoints(): number { return this.props.talentPoints; }
  get stats(): CharacterStats | undefined { return this.props.stats; }

  // === Business Methods ===
  
  /**
   * Compléter un personnage draft
   */
  completeDraft(data: {
    name: string;
    className: ClassName;
    raceId: RaceId;
    stats: CharacterStats;
    portrait: string;
    gender: string;
    physicalDescription: string;
  }): void {
    if (!this.isDraft) {
      throw new Error('Only draft characters can be completed');
    }

    Object.assign(this.props, {
      ...data,
      state: 'created' as const,
    });

    this.initializeCompleteCharacter();
    this.validate();
  }

  private initializeCompleteCharacter(): void {
    // Calcul HP initial selon classe et stats
    const baseHp = this.calculateBaseHp();
    this.props.hp = baseHp;
    this.props.hpMax = baseHp;

    // PA/PM selon classe
    this.initializeResources();
  }

  private calculateBaseHp(): number {
    const vigorBonus = this.props.stats 
      ? this.props.stats.getVigorModifier()
      : 0;
    
    const classBaseHp: Record<ClassName, number> = {
      guerrier: 12,
      rogue: 8,
      mage: 6,
    };

    const base = this.props.className 
      ? classBaseHp[this.props.className] 
      : 10;

    return base + vigorBonus;
  }

  private initializeResources(): void {
    const resourcesByClass: Record<ClassName, { pa: number; pm: number }> = {
      guerrier: { pa: 6, pm: 4 },
      rogue: { pa: 5, pm: 6 },
      mage: { pa: 7, pm: 3 },
    };

    const resources = this.props.className
      ? resourcesByClass[this.props.className]
      : { pa: 6, pm: 4 };

    this.props.pa = resources.pa;
    this.props.paMax = resources.pa;
    this.props.pm = resources.pm;
    this.props.pmMax = resources.pm;
  }

  /**
   * Gagner un niveau
   */
  levelUp(): void {
    if (!this.isComplete) {
      throw new Error('Cannot level up a draft character');
    }

    if (this.props.level >= 20) {
      throw new Error('Maximum level reached');
    }

    this.props.level += 1;
    this.props.talentPoints += 1;

    // Recalculer HP max
    const hpGain = this.calculateHpGainOnLevelUp();
    this.props.hpMax += hpGain;
    this.props.hp += hpGain; // Soigne aussi
  }

  private calculateHpGainOnLevelUp(): number {
    const vigorBonus = this.props.stats 
      ? this.props.stats.getVigorModifier()
      : 0;
    
    const classHpGain: Record<ClassName, number> = {
      guerrier: 8,
      rogue: 6,
      mage: 4,
    };

    const base = this.props.className 
      ? classHpGain[this.props.className] 
      : 6;

    return base + vigorBonus;
  }

  /**
   * Prendre des dégâts
   */
  takeDamage(amount: number): void {
    if (amount < 0) throw new Error('Damage cannot be negative');
    
    this.props.hp = Math.max(0, this.props.hp - amount);
    
    if (this.props.hp === 0 && !this.props.isDeceased) {
      this.die();
    }
  }

  /**
   * Se soigner
   */
  heal(amount: number): void {
    if (!this.isAlive) {
      throw new Error('Cannot heal a deceased character');
    }
    
    if (amount < 0) throw new Error('Heal amount cannot be negative');
    
    this.props.hp = Math.min(this.props.hpMax, this.props.hp + amount);
  }

  /**
   * Mort du personnage
   */
  private die(): void {
    this.props.isDeceased = true;
    this.props.diedAt = new Date();
  }

  /**
   * Débloquer un rang de talent
   */
  unlockTalentRank(voieId: string, rank: number): void {
    if (this.props.talentPoints < 1) {
      throw new Error('No talent points available');
    }

    if (rank < 1 || rank > 5) {
      throw new Error('Rank must be between 1 and 5');
    }

    // Vérifier le rang précédent
    const currentRank = this.props.unlockedRanks.find(r => r.voieId === voieId);
    if (rank > 1 && (!currentRank || currentRank.rank < rank - 1)) {
      throw new Error('Must unlock previous ranks first');
    }

    // Mettre à jour ou ajouter
    const existingIndex = this.props.unlockedRanks.findIndex(r => r.voieId === voieId);
    if (existingIndex >= 0) {
      this.props.unlockedRanks[existingIndex] = new TalentRank(voieId, rank);
    } else {
      this.props.unlockedRanks.push(new TalentRank(voieId, rank));
    }

    this.props.talentPoints -= 1;
  }

  /**
   * Ajouter de l'XP (avec level-up automatique)
   */
  addExperience(amount: number): { leveledUp: boolean; newLevel?: number } {
    if (amount < 0) throw new Error('XP amount cannot be negative');
    
    this.props.totalXp += amount;
    
    const xpForNextLevel = this.calculateXpForLevel(this.props.level + 1);
    
    if (this.props.totalXp >= xpForNextLevel && this.props.level < 20) {
      this.levelUp();
      return { leveledUp: true, newLevel: this.props.level };
    }
    
    return { leveledUp: false };
  }

  private calculateXpForLevel(level: number): number {
    // Règle métier : XP requis pour chaque niveau
    return 100 * level * level;
  }

  /**
   * Dépenser des PA
   */
  spendActionPoints(amount: number): void {
    if (amount > this.props.pa) {
      throw new Error('Insufficient action points');
    }
    this.props.pa -= amount;
  }

  /**
   * Dépenser des PM
   */
  spendMovementPoints(amount: number): void {
    if (amount > this.props.pm) {
      throw new Error('Insufficient movement points');
    }
    this.props.pm -= amount;
  }

  /**
   * Restaurer les ressources (début de tour)
   */
  restoreResources(): void {
    this.props.pa = this.props.paMax;
    this.props.pm = this.props.pmMax;
    
    // Réduire les cooldowns
    for (const aptitude of this.props.aptitudes) {
      if (aptitude.currentCooldown > 0) {
        aptitude.currentCooldown -= 1;
      }
    }
  }

  /**
   * Exporter les props (pour persistance)
   */
  toProps(): Readonly<CharacterProps> {
    return Object.freeze({ ...this.props });
  }
}
```

**Étape 1.3 : Repository Interface**

Créer `apps/backend/src/domain/character/repositories/ICharacterRepository.ts` :

```typescript
import { Character } from '../entities/Character';

export interface ICharacterRepository {
  findById(id: string): Promise<Character | null>;
  findByUserId(userId: string): Promise<Character[]>;
  save(character: Character): Promise<void>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

export const ICharacterRepository = Symbol('ICharacterRepository');
```

### Phase 2 : Infrastructure Layer

**Étape 2.1 : Mapper**

Créer `apps/backend/src/infrastructure/persistence/mongo/mappers/CharacterMapper.ts` :

```typescript
import { Character, CharacterProps } from '@/domain/character/entities/Character';
import { CharacterStats } from '@/domain/character/value-objects/CharacterStats';
import { TalentRank } from '@/domain/character/value-objects/TalentRank';
import { CharacterDocument } from '../schemas/CharacterDocument';

export class CharacterMapper {
  /**
   * Domain Entity → MongoDB Document
   */
  static toPersistence(entity: Character): Partial<CharacterDocument> {
    const props = entity.toProps();
    
    return {
      characterId: props.characterId,
      userId: props.userId,
      name: props.name,
      physicalDescription: props.physicalDescription,
      className: props.className,
      raceId: props.raceId,
      stats: props.stats ? {
        vigor: props.stats.vigor,
        finesse: props.stats.finesse,
        mind: props.stats.mind,
        survival: props.stats.survival,
      } : undefined,
      pa: props.pa,
      paMax: props.paMax,
      pm: props.pm,
      pmMax: props.pmMax,
      talentPoints: props.talentPoints,
      unlockedRanks: props.unlockedRanks.map(r => ({
        voieId: r.voieId,
        rank: r.rank,
      })),
      aptitudes: props.aptitudes,
      hp: props.hp,
      hpMax: props.hpMax,
      totalXp: props.totalXp,
      portrait: props.portrait,
      gender: props.gender,
      inspirationPoints: props.inspirationPoints,
      isDeceased: props.isDeceased,
      diedAt: props.diedAt,
      deathLocation: props.deathLocation,
      state: props.state,
      inventory: props.inventory,
      spells: props.spells,
      level: props.level,
    };
  }

  /**
   * MongoDB Document → Domain Entity
   */
  static toDomain(doc: CharacterDocument): Character {
    const props: CharacterProps = {
      characterId: doc.characterId,
      userId: doc.userId?.toString(),
      name: doc.name,
      physicalDescription: doc.physicalDescription,
      className: doc.className as any,
      raceId: doc.raceId as any,
      stats: doc.stats ? new CharacterStats(
        doc.stats.vigor,
        doc.stats.finesse,
        doc.stats.mind,
        doc.stats.survival,
      ) : undefined,
      pa: doc.pa ?? 6,
      paMax: doc.paMax ?? 6,
      pm: doc.pm ?? 4,
      pmMax: doc.pmMax ?? 4,
      talentPoints: doc.talentPoints ?? 0,
      unlockedRanks: (doc.unlockedRanks ?? []).map(r => 
        new TalentRank(r.voieId, r.rank)
      ),
      aptitudes: doc.aptitudes ?? [],
      hp: doc.hp ?? 0,
      hpMax: doc.hpMax ?? 0,
      totalXp: doc.totalXp ?? 0,
      portrait: doc.portrait,
      gender: doc.gender,
      inspirationPoints: doc.inspirationPoints ?? 1,
      isDeceased: doc.isDeceased ?? false,
      diedAt: doc.diedAt,
      deathLocation: doc.deathLocation,
      state: doc.state ?? 'draft',
      inventory: doc.inventory ?? [],
      spells: doc.spells ?? [],
      level: doc.level ?? 1,
    };

    return Character.reconstitute(props);
  }

  static toDomainMany(docs: CharacterDocument[]): Character[] {
    return docs.map(doc => this.toDomain(doc));
  }
}
```

**Étape 2.2 : Repository MongoDB**

Créer `apps/backend/src/infrastructure/persistence/mongo/repositories/MongoCharacterRepository.ts` :

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ICharacterRepository } from '@/domain/character/repositories/ICharacterRepository';
import { Character } from '@/domain/character/entities/Character';
import { CharacterDocument } from '../schemas/CharacterDocument';
import { CharacterMapper } from '../mappers/CharacterMapper';

@Injectable()
export class MongoCharacterRepository implements ICharacterRepository {
  constructor(
    @InjectModel('Character')
    private readonly model: Model<CharacterDocument>,
  ) {}

  async findById(id: string): Promise<Character | null> {
    const doc = await this.model.findOne({ characterId: id }).exec();
    return doc ? CharacterMapper.toDomain(doc) : null;
  }

  async findByUserId(userId: string): Promise<Character[]> {
    const docs = await this.model.find({ userId }).exec();
    return CharacterMapper.toDomainMany(docs);
  }

  async save(character: Character): Promise<void> {
    const persistence = CharacterMapper.toPersistence(character);
    
    await this.model.updateOne(
      { characterId: character.id },
      { $set: persistence },
      { upsert: true },
    ).exec();
  }

  async delete(id: string): Promise<void> {
    await this.model.deleteOne({ characterId: id }).exec();
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.model.countDocuments({ characterId: id }).exec();
    return count > 0;
  }
}
```

### Phase 3 : Application Layer

**Étape 3.1 : Use Cases**

Créer `apps/backend/src/application/character/use-cases/CreateCharacterDraft.ts` :

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { ICharacterRepository } from '@/domain/character/repositories/ICharacterRepository';
import { Character } from '@/domain/character/entities/Character';

export interface CreateCharacterDraftCommand {
  characterId: string;
  userId?: string;
}

@Injectable()
export class CreateCharacterDraftUseCase {
  constructor(
    @Inject(ICharacterRepository)
    private readonly repository: ICharacterRepository,
  ) {}

  async execute(command: CreateCharacterDraftCommand): Promise<Character> {
    const character = Character.createDraft({
      characterId: command.characterId,
      userId: command.userId,
    });

    await this.repository.save(character);
    return character;
  }
}
```

**Étape 3.2 : Application Service**

Créer `apps/backend/src/application/character/CharacterAppService.ts` :

```typescript
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ICharacterRepository } from '@/domain/character/repositories/ICharacterRepository';
import { Character, ClassName, RaceId } from '@/domain/character/entities/Character';
import { CharacterStats } from '@/domain/character/value-objects/CharacterStats';

@Injectable()
export class CharacterAppService {
  constructor(
    @Inject(ICharacterRepository)
    private readonly repository: ICharacterRepository,
  ) {}

  async createDraft(params: {
    characterId: string;
    userId?: string;
  }): Promise<Character> {
    const character = Character.createDraft(params);
    await this.repository.save(character);
    return character;
  }

  async findById(id: string): Promise<Character> {
    const character = await this.repository.findById(id);
    if (!character) {
      throw new NotFoundException(`Character ${id} not found`);
    }
    return character;
  }

  async completeDraft(
    id: string,
    data: {
      name: string;
      className: ClassName;
      raceId: RaceId;
      stats: CharacterStats;
      portrait: string;
      gender: string;
      physicalDescription: string;
    },
  ): Promise<Character> {
    const character = await this.findById(id);
    
    character.completeDraft(data);
    await this.repository.save(character);
    
    return character;
  }

  async levelUp(id: string): Promise<Character> {
    const character = await this.findById(id);
    
    character.levelUp();
    await this.repository.save(character);
    
    return character;
  }

  async takeDamage(id: string, amount: number): Promise<Character> {
    const character = await this.findById(id);
    
    character.takeDamage(amount);
    await this.repository.save(character);
    
    return character;
  }

  async addExperience(id: string, amount: number): Promise<{ 
    character: Character; 
    leveledUp: boolean 
  }> {
    const character = await this.findById(id);
    
    const result = character.addExperience(amount);
    await this.repository.save(character);
    
    return { character, leveledUp: result.leveledUp };
  }
}
```

### Phase 4 : API Layer

**Étape 4.1 : DTO Mapper**

Créer `apps/backend/src/api/character/dto/mappers/CharacterDtoMapper.ts` :

```typescript
import { Character } from '@/domain/character/entities/Character';
import { CharacterResponseDto, DraftCharacterResponseDto } from '../response/CharacterResponseDto';

export class CharacterDtoMapper {
  static toDto(entity: Character): CharacterResponseDto | DraftCharacterResponseDto {
    if (entity.isDraft) {
      return this.toDraftDto(entity);
    }
    return this.toCompleteDto(entity);
  }

  private static toDraftDto(entity: Character): DraftCharacterResponseDto {
    const props = entity.toProps();
    
    return {
      characterId: props.characterId,
      name: props.name,
      state: 'draft',
      className: props.className,
      raceId: props.raceId,
      level: props.level,
      portrait: props.portrait,
      gender: props.gender,
      hp: props.hp,
      hpMax: props.hpMax,
      totalXp: props.totalXp,
      // ... autres champs
    };
  }

  private static toCompleteDto(entity: Character): CharacterResponseDto {
    const props = entity.toProps();
    
    return {
      characterId: props.characterId,
      name: props.name!,
      physicalDescription: props.physicalDescription!,
      state: 'created',
      className: props.className!,
      raceId: props.raceId!,
      level: props.level,
      // ... tous les champs requis
    };
  }

  static toDtoMany(entities: Character[]): (CharacterResponseDto | DraftCharacterResponseDto)[] {
    return entities.map(e => this.toDto(e));
  }
}
```

**Étape 4.2 : Controller (simplifié)**

Modifier `apps/backend/src/api/character/CharacterController.ts` :

```typescript
import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { CharacterAppService } from '@/application/character/CharacterAppService';
import { CharacterDtoMapper } from './dto/mappers/CharacterDtoMapper';

@Controller('characters')
export class CharacterController {
  constructor(private readonly service: CharacterAppService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const character = await this.service.findById(id);
    return CharacterDtoMapper.toDto(character);
  }

  @Post('draft')
  async createDraft(@Body() dto: CreateDraftDto) {
    const character = await this.service.createDraft(dto);
    return CharacterDtoMapper.toDto(character);
  }

  @Post(':id/complete')
  async complete(@Param('id') id: string, @Body() dto: CompleteCharacterDto) {
    const character = await this.service.completeDraft(id, dto);
    return CharacterDtoMapper.toDto(character);
  }

  @Post(':id/level-up')
  async levelUp(@Param('id') id: string) {
    const character = await this.service.levelUp(id);
    return CharacterDtoMapper.toDto(character);
  }
}
```

### Phase 5 : Configuration NestJS

Modifier `apps/backend/src/modules/character.module.ts` :

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CharacterController } from '@/api/character/CharacterController';
import { CharacterAppService } from '@/application/character/CharacterAppService';
import { MongoCharacterRepository } from '@/infrastructure/persistence/mongo/repositories/MongoCharacterRepository';
import { CharacterSchema } from '@/infrastructure/persistence/mongo/schemas/CharacterDocument';
import { ICharacterRepository } from '@/domain/character/repositories/ICharacterRepository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Character', schema: CharacterSchema }
    ]),
  ],
  controllers: [CharacterController],
  providers: [
    CharacterAppService,
    {
      provide: ICharacterRepository,
      useClass: MongoCharacterRepository,
    },
  ],
  exports: [CharacterAppService],
})
export class CharacterModule {}
```

## ✅ Checklist de migration

### Phase 1 : Domain (Character uniquement)
- [ ] Créer `CharacterStats` (value object)
- [ ] Créer `ResourcePool` (value object)
- [ ] Créer `TalentRank` (value object)
- [ ] Créer `Character` (entité avec logique métier)
- [ ] Créer `ICharacterRepository` (interface)
- [ ] Tests unitaires des entités ✅

### Phase 2 : Infrastructure
- [ ] Créer `CharacterMapper` (Document ↔ Entity)
- [ ] Créer `MongoCharacterRepository` (impl)
- [ ] Tests d'intégration repository

### Phase 3 : Application
- [ ] Créer `CharacterAppService`
- [ ] Créer use cases (optionnel pour MVP)
- [ ] Tests application service

### Phase 4 : API
- [ ] Créer `CharacterDtoMapper` (Entity ↔ DTO)
- [ ] Simplifier DTOs (retirer logique)
- [ ] Adapter `CharacterController`
- [ ] Tests API (E2E)

### Phase 5 : Configuration
- [ ] Configurer injection dépendances
- [ ] Migrer données existantes (si nécessaire)

## 🎯 Prochaines étapes après Character

1. **Combat** (même pattern)
2. **Spell/Item** (plus simples)
3. **Chat** (orchestration uniquement)

## 📚 Ressources

- **DDD** : Domain-Driven Design par Eric Evans
- **Clean Architecture** : Robert C. Martin
- **Hexagonal Architecture** : Alistair Cockburn

