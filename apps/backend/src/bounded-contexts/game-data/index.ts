// Game Data Bounded Context
// Centralized READ-ONLY catalogue of all game definitions

export { GameDataModule } from './game-data.module.js';

// Application Services (for injection into other BCs)
export { GameDataService } from './application/services/GameDataService.js';
export { ClassDataService } from './application/services/ClassDataService.js';
export { RaceDataService } from './application/services/RaceDataService.js';
export { AptitudeDataService } from './application/services/AptitudeDataService.js';
export { ItemDataService } from './application/services/ItemDataService.js';
export { EnemyDataService } from './application/services/EnemyDataService.js';

// Domain Entities (for type references)
export { CharacterClass } from './domain/class/entities/CharacterClass.js';
export { Race } from './domain/race/entities/Race.js';
export { Aptitude } from './domain/aptitude/entities/Aptitude.js';
export { ItemDefinition } from './domain/item/entities/ItemDefinition.js';
export { EnemyDefinition } from './domain/enemy/entities/EnemyDefinition.js';

// Value Objects
export { TalentRank } from './domain/class/value-objects/TalentRank.js';
export { TalentTree } from './domain/class/value-objects/TalentTree.js';
export { ClassStats } from './domain/class/value-objects/ClassStats.js';
export { RacialBonuses } from './domain/race/value-objects/RacialBonuses.js';
export { TraitEffect } from './domain/race/value-objects/TraitEffect.js';
export type { TraitEffectType, TraitCondition } from './domain/race/value-objects/TraitEffect.js';

// Infrastructure (for advanced usage)
export { GameDataSeeder } from './infrastructure/seeding/GameDataSeeder.js';
