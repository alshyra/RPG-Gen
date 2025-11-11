import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';
import { DiceModule } from './dice/dice.module';
import { ImageModule } from './image/image.module';

@Module({
  imports: [ChatModule, DiceModule, ImageModule],
})
export class AppModule {}
