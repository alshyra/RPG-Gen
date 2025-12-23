import { CharacterStatsVO } from "../value-objects/CharacterStatsVO.js";
import { ResourcePool } from "../value-objects/ResourcePool.js";
import { TalentRank } from "../value-objects/TalentRank.js";
import type { InventoryItemMeta } from "../../api/dto/response/InventoryItemMeta.js";

export type CharacterState = "draft" | "created";

export interface InventoryItem {
  _id: string;
  name: string;
  definitionId: string;
  qty: number;
  description?: string;
  equipped: boolean;
  meta?: InventoryItemMeta;
}

export interface CharacterAptitude {
  aptitudeId: string;
  currentCooldown: number;
}

export interface CharacterProps {
  characterId: string;
  userId?: string;
  name?: string;
  physicalDescription?: string;
  portrait?: string;
  gender?: string;
  state: CharacterState;
  className?: ClassName;
  raceId?: RaceId;
  level: number;
  stats?: CharacterStatsVO;
  hp: ResourcePool;
  pa: ResourcePool;
  pm: ResourcePool;
  totalXp: number;
  inspirationPoints: number;
  talentPoints: number;
  unlockedRanks: TalentRank[];
  aptitudes: CharacterAptitude[];
  inventory: InventoryItem[];
  isDeceased: boolean;
  diedAt?: Date;
  deathLocation?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CompleteCharacterData {
  name: string;
  className: ClassName;
  raceId: RaceId;
  stats: CharacterStatsVO;
  physicalDescription?: string;
  gender?: string;
  portrait?: string;
}

/**
 * Character Domain Entity.
 * Contains all business logic related to character management.
 */
export class CharacterEntity {
  private props: CharacterProps;

  private constructor(props: CharacterProps) {
    this.props = props;
    this.validate();
  }

  // === Factory Methods ===

  static createDraft(params: { characterId: string; userId?: string }): CharacterEntity {
    const props: CharacterProps = {
      characterId: params.characterId,
      userId: params.userId,
      state: "draft",
      level: 1,
      hp: ResourcePool.create(10),
      pa: ResourcePool.create(6),
      pm: ResourcePool.create(4),
      totalXp: 0,
      inspirationPoints: 1,
      talentPoints: 0,
      unlockedRanks: [],
      aptitudes: [],
      inventory: [],
      isDeceased: false,
    };
    return new CharacterEntity(props);
  }

  static reconstitute(props: CharacterProps): CharacterEntity {
    return new CharacterEntity(props);
  }

  // === Validation ===

  private validate(): void {
    if (!this.props.characterId) {
      throw new Error("Character must have an ID");
    }
    if (this.props.level < 1) {
      throw new Error("Level must be at least 1");
    }
  }

  private validateComplete(): void {
    const requiredFields: (keyof CharacterProps)[] = [
      "name",
      "className",
      "raceId",
      "stats",
    ];
    const missingFields = requiredFields.filter(field => !this.props[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }
  }

  // === Getters ===

  get id(): string {
    return this.props.characterId;
  }

  get userId(): string | undefined {
    return this.props.userId;
  }

  get name(): string | undefined {
    return this.props.name;
  }

  get state(): CharacterState {
    return this.props.state;
  }

  get isDraft(): boolean {
    return this.props.state === "draft";
  }

  get isComplete(): boolean {
    return this.props.state === "created";
  }

  get level(): number {
    return this.props.level;
  }

  get hp(): number {
    return this.props.hp.current;
  }

  get hpMax(): number {
    return this.props.hp.max;
  }

  get pa(): number {
    return this.props.pa.current;
  }

  get paMax(): number {
    return this.props.pa.max;
  }

  get pm(): number {
    return this.props.pm.current;
  }

  get pmMax(): number {
    return this.props.pm.max;
  }

  get isAlive(): boolean {
    return !this.props.isDeceased;
  }

  get className(): ClassName | undefined {
    return this.props.className;
  }

  get raceId(): RaceId | undefined {
    return this.props.raceId;
  }

  get talentPoints(): number {
    return this.props.talentPoints;
  }

  get stats(): CharacterStatsVO | undefined {
    return this.props.stats;
  }

  get totalXp(): number {
    return this.props.totalXp;
  }

  get inspirationPoints(): number {
    return this.props.inspirationPoints;
  }

  get inventory(): InventoryItem[] {
    return [...this.props.inventory];
  }

  get aptitudes(): CharacterAptitude[] {
    return [...this.props.aptitudes];
  }

  get unlockedRanks(): TalentRank[] {
    return [...this.props.unlockedRanks];
  }

  get portrait(): string | undefined {
    return this.props.portrait;
  }

  get gender(): string | undefined {
    return this.props.gender;
  }

  get physicalDescription(): string | undefined {
    return this.props.physicalDescription;
  }

  get isDeceased(): boolean {
    return this.props.isDeceased;
  }

  get diedAt(): Date | undefined {
    return this.props.diedAt;
  }

  get deathLocation(): string | undefined {
    return this.props.deathLocation;
  }

  // === Business Methods ===

  completeDraft(data: CompleteCharacterData): void {
    if (!this.isDraft) {
      throw new Error("Can only complete a draft character");
    }

    this.props.name = data.name;
    this.props.className = data.className;
    this.props.raceId = data.raceId;
    this.props.stats = data.stats;
    this.props.physicalDescription = data.physicalDescription;
    this.props.gender = data.gender;
    this.props.portrait = data.portrait;
    this.props.state = "created";

    this.validateComplete();
    this.initializeCompleteCharacter();
  }

  private initializeCompleteCharacter(): void {
    const baseHp = this.calculateBaseHp();
    this.props.hp = ResourcePool.create(baseHp);
    this.initializeResources();
  }

  private calculateBaseHp(): number {
    const vigorBonus = this.props.stats ? this.props.stats.getVigorModifier() * 2 : 0;
    const baseByClass: Record<ClassName, number> = {
      guerrier: 30,
      rogue: 22,
      mage: 18,
    };
    const base = this.props.className ? baseByClass[this.props.className] : 20;
    return base + vigorBonus;
  }

  private initializeResources(): void {
    const resourcesByClass: Record<ClassName, { pa: number; pm: number }> = {
      guerrier: { pa: 6, pm: 3 },
      rogue: { pa: 6, pm: 5 },
      mage: { pa: 6, pm: 3 },
    };
    const resources = this.props.className
      ? resourcesByClass[this.props.className]
      : { pa: 6, pm: 4 };
    this.props.pa = ResourcePool.create(resources.pa);
    this.props.pm = ResourcePool.create(resources.pm);
  }

  levelUp(): void {
    if (!this.isComplete) {
      throw new Error("Cannot level up a draft character");
    }
    if (!this.isAlive) {
      throw new Error("Cannot level up a deceased character");
    }

    this.props.level += 1;
    this.props.talentPoints += 1;

    const hpGain = this.calculateHpGainOnLevelUp();
    this.props.hp = new ResourcePool(
      this.props.hp.current + hpGain,
      this.props.hp.max + hpGain,
    );
  }

  private calculateHpGainOnLevelUp(): number {
    const vigorBonus = this.props.stats ? this.props.stats.getVigorModifier() : 0;
    const baseByClass: Record<ClassName, number> = {
      guerrier: 8,
      rogue: 6,
      mage: 4,
    };
    const base = this.props.className ? baseByClass[this.props.className] : 5;
    return base + vigorBonus;
  }

  takeDamage(amount: number): void {
    if (amount < 0) {
      throw new Error("Damage cannot be negative");
    }
    if (!this.isAlive) {
      throw new Error("Cannot damage a deceased character");
    }

    this.props.hp = this.props.hp.reduce(amount);

    if (this.props.hp.isEmpty()) {
      this.die();
    }
  }

  heal(amount: number): void {
    if (amount < 0) {
      throw new Error("Healing cannot be negative");
    }
    if (!this.isAlive) {
      throw new Error("Cannot heal a deceased character");
    }

    this.props.hp = this.props.hp.add(amount);
  }

  private die(): void {
    this.props.isDeceased = true;
    this.props.diedAt = new Date();
  }

  markAsDeceased(deathLocation?: string): void {
    this.props.isDeceased = true;
    this.props.diedAt = new Date();
    this.props.deathLocation = deathLocation;
  }

  unlockTalentRank(voieId: string, rank: number): void {
    if (this.props.talentPoints < 1) {
      throw new Error("No talent points available");
    }

    const existingRankIndex = this.props.unlockedRanks.findIndex(r => r.voieId === voieId);

    if (existingRankIndex === -1) {
      if (rank !== 1) {
        throw new Error("Must start at rank 1 for a new voie");
      }
      this.props.unlockedRanks.push(TalentRank.createFirst(voieId));
    } else {
      const existingRank = this.props.unlockedRanks[existingRankIndex];
      if (rank !== existingRank.rank + 1) {
        throw new Error("Must unlock ranks sequentially");
      }
      if (!existingRank.canUnlockNext()) {
        throw new Error("Already at maximum rank for this voie");
      }
      this.props.unlockedRanks[existingRankIndex] = existingRank.unlockNext();
    }

    this.props.talentPoints -= 1;
  }

  addExperience(amount: number): { leveledUp: boolean; newLevel?: number } {
    if (amount < 0) {
      throw new Error("XP amount cannot be negative");
    }

    this.props.totalXp += amount;

    const xpForNextLevel = this.calculateXpForLevel(this.props.level + 1);
    if (this.props.totalXp >= xpForNextLevel) {
      this.levelUp();
      return { leveledUp: true, newLevel: this.props.level };
    }

    return { leveledUp: false };
  }

  private calculateXpForLevel(level: number): number {
    return 100 * level * level;
  }

  spendActionPoints(amount: number): void {
    if (amount < 0) {
      throw new Error("Amount cannot be negative");
    }
    this.props.pa = this.props.pa.spend(amount);
  }

  spendMovementPoints(amount: number): void {
    if (amount < 0) {
      throw new Error("Amount cannot be negative");
    }
    this.props.pm = this.props.pm.spend(amount);
  }

  restoreResources(): void {
    this.props.pa = this.props.pa.restore();
    this.props.pm = this.props.pm.restore();

    this.props.aptitudes = this.props.aptitudes.map(apt => ({
      ...apt,
      currentCooldown: Math.max(0, apt.currentCooldown - 1),
    }));
  }

  addInspirationPoints(amount: number): void {
    if (amount < 0) {
      throw new Error("Amount cannot be negative");
    }
    this.props.inspirationPoints += amount;
  }

  spendInspirationPoint(): void {
    if (this.props.inspirationPoints < 1) {
      throw new Error("No inspiration points available");
    }
    this.props.inspirationPoints -= 1;
  }

  addAptitude(aptitudeId: string): void {
    const exists = this.props.aptitudes.some(a => a.aptitudeId === aptitudeId);
    if (exists) {
      throw new Error("Aptitude already learned");
    }
    this.props.aptitudes.push({ aptitudeId, currentCooldown: 0 });
  }

  removeAptitude(aptitudeId: string): void {
    const index = this.props.aptitudes.findIndex(a => a.aptitudeId === aptitudeId);
    if (index === -1) {
      throw new Error("Aptitude not found");
    }
    this.props.aptitudes.splice(index, 1);
  }

  setAptitudeCooldown(aptitudeId: string, cooldown: number): void {
    const aptitude = this.props.aptitudes.find(a => a.aptitudeId === aptitudeId);
    if (!aptitude) {
      throw new Error("Aptitude not found");
    }
    aptitude.currentCooldown = cooldown;
  }

  addInventoryItem(item: InventoryItem): void {
    const existingIndex = this.props.inventory.findIndex(
      i => i.definitionId === item.definitionId,
    );
    if (existingIndex !== -1) {
      this.props.inventory[existingIndex].qty += item.qty;
    } else {
      this.props.inventory.push({ ...item });
    }
  }

  removeInventoryItem(definitionId: string, qty?: number): void {
    const index = this.props.inventory.findIndex(i => i.definitionId === definitionId);
    if (index === -1) {
      throw new Error("Item not found in inventory");
    }

    if (qty && qty > 0) {
      const item = this.props.inventory[index];
      if (qty >= item.qty) {
        this.props.inventory.splice(index, 1);
      } else {
        item.qty -= qty;
      }
    } else {
      this.props.inventory.splice(index, 1);
    }
  }

  equipItem(definitionId: string): void {
    const item = this.props.inventory.find(i => i.definitionId === definitionId);
    if (!item) {
      throw new Error("Item not found in inventory");
    }
    item.equipped = true;
  }

  unequipItem(definitionId: string): void {
    const item = this.props.inventory.find(i => i.definitionId === definitionId);
    if (!item) {
      throw new Error("Item not found in inventory");
    }
    item.equipped = false;
  }

  updateInventoryItem(itemId: string, updates: Partial<InventoryItem>): void {
    const item = this.props.inventory.find(i => i.definitionId === itemId);
    if (!item) {
      throw new Error("Item not found in inventory");
    }
    if (updates.qty !== undefined) item.qty = updates.qty;
    if (updates.equipped !== undefined) item.equipped = updates.equipped;
    if (updates.name !== undefined) item.name = updates.name;
    if (updates.description !== undefined) item.description = updates.description;
    if (updates.meta !== undefined) item.meta = updates.meta;
  }

  // === Update Methods for Partial Updates ===

  updateBasicInfo(updates: {
    name?: string;
    physicalDescription?: string;
    portrait?: string;
    gender?: string;
  }): void {
    if (updates.name !== undefined) this.props.name = updates.name;
    if (updates.physicalDescription !== undefined) this.props.physicalDescription = updates.physicalDescription;
    if (updates.portrait !== undefined) this.props.portrait = updates.portrait;
    if (updates.gender !== undefined) this.props.gender = updates.gender;
  }

  updateStats(stats: CharacterStatsVO): void {
    this.props.stats = stats;
  }

  updateClass(className: ClassName): void {
    this.props.className = className;
  }

  updateRace(raceId: RaceId): void {
    this.props.raceId = raceId;
  }

  setHp(current: number, max?: number): void {
    const newMax = max ?? this.props.hp.max;
    this.props.hp = new ResourcePool(Math.min(current, newMax), newMax);
  }

  setPa(current: number, max?: number): void {
    const newMax = max ?? this.props.pa.max;
    this.props.pa = new ResourcePool(Math.min(current, newMax), newMax);
  }

  setPm(current: number, max?: number): void {
    const newMax = max ?? this.props.pm.max;
    this.props.pm = new ResourcePool(Math.min(current, newMax), newMax);
  }

  setLevel(level: number): void {
    if (level < 1) {
      throw new Error("Level must be at least 1");
    }
    this.props.level = level;
  }

  setTotalXp(xp: number): void {
    if (xp < 0) {
      throw new Error("XP cannot be negative");
    }
    this.props.totalXp = xp;
  }

  setTalentPoints(points: number): void {
    if (points < 0) {
      throw new Error("Talent points cannot be negative");
    }
    this.props.talentPoints = points;
  }

  setInspirationPoints(points: number): void {
    if (points < 0) {
      throw new Error("Inspiration points cannot be negative");
    }
    this.props.inspirationPoints = points;
  }

  setState(state: CharacterState): void {
    this.props.state = state;
    if (state === "created") {
      this.validateComplete();
    }
  }

  setInventory(inventory: InventoryItem[]): void {
    this.props.inventory = [...inventory];
  }

  // === Export ===

  toProps(): Readonly<CharacterProps> {
    return Object.freeze({ ...this.props });
  }
}
