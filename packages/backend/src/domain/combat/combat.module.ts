// import { Module } from '@nestjs/common';
// import { MongooseModule } from '@nestjs/mongoose';
// import { CombatSession, CombatSessionSchema } from '../../infra/mongo/combat-session.schema.js';

// import { CombatPersistenceService } from './persistence/combat-persistence.service.js';
// import { TurnOrderService } from './services/turn-order.service.js';
// import { ActionEconomyService } from './services/action-economy.service.js';

// import { CombatAppService } from './combat.app.service.js';
// import { InitService } from './services/init.service.js';

// @Module({
//   imports: [
//     MongooseModule.forFeature([
//       {
//         name: CombatSession.name,
//         schema: CombatSessionSchema,
//       },
//     ]),
//   ],
//   providers: [
//     // Persistence
//     CombatPersistenceService,
//     InitService,
//     TurnOrderService,
//     ActionEconomyService,

//     // Core domain services / app facade
//     CombatAppService,
//   ],
//   exports: [CombatAppService],
// })
// export class CombatModule {}
