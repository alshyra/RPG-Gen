import { Prop, Schema } from '@nestjs/mongoose';
import { GameInstruction } from './GameInstruction.js';

@Schema({ _id: false })
export class ChatMessage {
  @Prop({ required: true, type: String })
  role: 'user' | 'assistant' | 'system';

  @Prop({ required: true, type: String })
  narrative: string;

  @Prop({ type: [GameInstruction], default: [] })
  instructions?: GameInstruction[];
}
