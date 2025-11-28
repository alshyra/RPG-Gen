import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import type { ChatMessageDto } from '../dto/ChatMessageDto.js';

const isRole = (r: string): r is 'user' | 'assistant' | 'system' => r === 'user' || r === 'assistant' || r === 'system';

const isInstruction = (v: any): boolean => {
  if (!v || typeof v !== 'object') return false;
  if (typeof v.type !== 'string') return false;
  // allow unknown types but require a type string — GameInstructionProcessor will further validate
  return true;
};

@Injectable()
export class ValidateChatMessagePipe implements PipeTransform {
  transform(value: ChatMessageDto) {
    if (!value || typeof value !== 'object') throw new BadRequestException('Invalid body');
    if (!isRole(value.role)) throw new BadRequestException('Invalid role');
    if (typeof value.narrative !== 'string') throw new BadRequestException('narrative must be a string');

    if (value.instructions !== undefined) {
      if (!Array.isArray(value.instructions)) throw new BadRequestException('instructions must be an array');
      if (value.instructions.some(instr => !isInstruction(instr))) throw new BadRequestException('invalid instruction shape');
    }
    value.narrative = value.narrative.trim();
    return value;
  }
}
