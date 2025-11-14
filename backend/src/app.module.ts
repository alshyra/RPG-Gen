import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatModule } from './chat/chat.module';
import { DiceModule } from './dice/dice.module';
import { ImageModule } from './image/image.module';
import { AuthModule } from './auth/auth.module';
import { CharacterModule } from './character/character.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/rpggen',
      {
        retryAttempts: 5,
        retryDelay: 3000,
      }
    ),
    AuthModule,
    ChatModule,
    DiceModule,
    ImageModule,
    CharacterModule,
  ],
})
export class AppModule {}
