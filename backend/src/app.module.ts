import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import pino from 'pino';
import pretty from 'pino-pretty';
import { AuthModule } from './auth/auth.module';
import { CharacterModule } from './character/character.module';
import { DiceModule } from './dice/dice.module';
import { ImageModule } from './image/image.module';

import { ConversationModule } from './conversation/conversation.module';
import { HealthModule } from './health/health.module';

// Create pino logger instance
const getPinoLogger = () => {
  if (process.env.LOG_FORMAT === 'json') {
    return pino();
  }
  // Use pino-pretty for pretty-printing in development
  return pino(
    pretty({
      colorize: true,
      singleLine: false,
      sync: true,
    }),
  );
};

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        logger: getPinoLogger(),
      },
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/rpggen', {
      retryAttempts: 5,
      retryDelay: 3000,
    }),
    AuthModule,
    ConversationModule,
    DiceModule,
    ImageModule,
    HealthModule,
    CharacterModule,
  ],
})
export class AppModule {}
