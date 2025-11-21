// GENERATED FROM backend/src/schemas - do not edit manually

import { ChatMessageDto } from './chatmessage.dto';

export interface ChatHistoryDto {
  userId: string;
  characterId: string;
  messages: ChatMessageDto[];
  lastUpdated: Date;
}
export type CreateChatHistoryDto = Omit<ChatHistoryDto, 'userId' | 'characterId'>;
export type UpdateChatHistoryDto = Partial<CreateChatHistoryDto>;
