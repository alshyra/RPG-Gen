import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import { ClassDocument, ClassSchema } from './infrastructure/persistence/mongo/schemas/ClassDocument.js';
import { RaceDocument, RaceSchema } from './infrastructure/persistence/mongo/schemas/RaceDocument.js';
import { AptitudeDocument, AptitudeSchema } from './infrastructure/persistence/mongo/schemas/AptitudeDocument.js';
import { ItemDocument, ItemSchema } from './infrastructure/persistence/mongo/schemas/ItemDocument.js';
import { EnemyDocument, EnemySchema } from './infrastructure/persistence/mongo/schemas/EnemyDocument.js';

// Repositories
import { MongoClassRepository } from './infrastructure/persistence/mongo/repositories/MongoClassRepository.js';
import { MongoRaceRepository } from './infrastructure/persistence/mongo/repositories/MongoRaceRepository.js';
import { MongoAptitudeRepository } from './infrastructure/persistence/mongo/repositories/MongoAptitudeRepository.js';
import { MongoItemRepository } from './infrastructure/persistence/mongo/repositories/MongoItemRepository.js';
import { MongoEnemyRepository } from './infrastructure/persistence/mongo/repositories/MongoEnemyRepository.js';

// Repository tokens
import { CLASS_REPOSITORY } from './domain/class/repositories/IClassRepository.js';
import { RACE_REPOSITORY } from './domain/race/repositories/IRaceRepository.js';
import { APTITUDE_REPOSITORY } from './domain/aptitude/repositories/IAptitudeRepository.js';
import { ITEM_REPOSITORY } from './domain/item/repositories/IItemRepository.js';
import { ENEMY_REPOSITORY } from './domain/enemy/repositories/IEnemyRepository.js';

// Application services
import { ClassDataService } from './application/services/ClassDataService.js';
import { RaceDataService } from './application/services/RaceDataService.js';
import { AptitudeDataService } from './application/services/AptitudeDataService.js';
import { ItemDataService } from './application/services/ItemDataService.js';
import { EnemyDataService } from './application/services/EnemyDataService.js';
import { GameDataService } from './application/services/GameDataService.js';

// Infrastructure
import { GameDataSeeder } from './infrastructure/seeding/GameDataSeeder.js';

// Controllers
import { ClassesController } from './api/controllers/classes.controller.js';
import { RacesController } from './api/controllers/game-data-races.controller.js';
import { AptitudesController } from './api/controllers/aptitudes.controller.js';
import { ItemsController } from './api/controllers/items.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClassDocument.name, schema: ClassSchema },
      { name: RaceDocument.name, schema: RaceSchema },
      { name: AptitudeDocument.name, schema: AptitudeSchema },
      { name: ItemDocument.name, schema: ItemSchema },
      { name: EnemyDocument.name, schema: EnemySchema },
    ]),
  ],
  controllers: [
    ClassesController,
    RacesController,
    AptitudesController,
    ItemsController,
  ],
  providers: [
    // Repository bindings (port → adapter)
    {
      provide: CLASS_REPOSITORY,
      useClass: MongoClassRepository,
    },
    {
      provide: RACE_REPOSITORY,
      useClass: MongoRaceRepository,
    },
    {
      provide: APTITUDE_REPOSITORY,
      useClass: MongoAptitudeRepository,
    },
    {
      provide: ITEM_REPOSITORY,
      useClass: MongoItemRepository,
    },
    {
      provide: ENEMY_REPOSITORY,
      useClass: MongoEnemyRepository,
    },
    // Application services
    ClassDataService,
    RaceDataService,
    AptitudeDataService,
    ItemDataService,
    EnemyDataService,
    GameDataService,
    // Infrastructure
    GameDataSeeder,
  ],
  exports: [
    // Export services for other BCs to consume
    GameDataService,
    ClassDataService,
    RaceDataService,
    AptitudeDataService,
    ItemDataService,
    EnemyDataService,
    GameDataSeeder,
  ],
})
export class GameDataModule implements OnModuleInit {
  private readonly logger = new Logger(GameDataModule.name);

  constructor(private readonly seeder: GameDataSeeder) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing GameDataModule...');
    await this.seeder.seedAll();
  }
}
