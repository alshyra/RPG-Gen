import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth.module.js';
import { CharacterModule } from './modules/character.module.js';
import { ChatModule } from './modules/chat.module.js';
import { CombatModule } from './modules/combat.module.js';
import { DiceModule } from './modules/dice.module.js';
import { HealthModule } from './modules/health.module.js';
import { ImageModule } from './modules/image.module.js';
import { InventoryModule } from './modules/inventory.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/rpggen', {
      retryAttempts: 5,
      retryDelay: 3000,
    }),
    AuthModule,
    ChatModule,
    CombatModule,
    DiceModule,
    ImageModule,
    HealthModule,
    CharacterModule,
    InventoryModule,
  ],
})
export class AppModule {}
