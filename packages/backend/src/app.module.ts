import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import pino from 'pino';
import pretty from 'pino-pretty';
import { ChatModule } from './chat/chat.module.js';
import { DiceModule } from './dice/dice.module.js';
import { ImageModule } from './image/image.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CharacterModule } from './character/character.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/rpggen', {
      retryAttempts: 5,
      retryDelay: 3000,
    }),
    AuthModule,
    ChatModule,
    DiceModule,
    ImageModule,
    HealthModule,
    CharacterModule,
  ],
})
export class AppModule {}
