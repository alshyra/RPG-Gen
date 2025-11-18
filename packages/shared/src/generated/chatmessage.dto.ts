// GENERATED FROM backend/src/schemas - do not edit manually

import { MessageMetaDto } from './messagemeta.dto';

export interface ChatMessageDto {
  role: string;
  text: string;
  timestamp: number;
  meta?: MessageMetaDto;
}
export type CreateChatMessageDto = Partial<ChatMessageDto>;
export type UpdateChatMessageDto = Partial<CreateChatMessageDto>;
