// GENERATED FROM backend/src/schemas - do not edit manually

import { ChatMessageDto } from './chatmessage.dto';

export interface ConversationDto {
  userId: string;
  characterId: string;
  messages: ChatMessageDto[];
  lastUpdated: Date;
}
export type CreateConversationDto = Omit<ConversationDto, 'userId' | 'characterId'>;
export type UpdateConversationDto = Partial<CreateConversationDto>;
