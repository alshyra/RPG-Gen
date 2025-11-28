import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ChatMessageDto } from './dto/ChatMessageDto.js';
import type { GameInstructionDto } from './dto/GameInstructionDto.js';
import { ChatHistory, ChatHistoryDocument } from './schema/index.js';
import type { ChatMessage } from './schema/ChatMessage.js';
import type { GameInstruction } from './schema/GameInstruction.js';
import type { CharacterResponseDto } from '../character/dto/CharacterResponseDto.js';
import { calculateArmorClass } from '../character/armor-class.util.js';
import { AbilityScoresResponseDto } from 'src/character/dto/AbilityScoresResponseDto.js';
import { Content } from '@google/genai';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  private readonly MAX_MESSAGES = Number(process.env.CONV_MAX_MESSAGES || '60');

  constructor(
    @InjectModel(ChatHistory.name) private chatHistoryModel: Model<ChatHistoryDocument>,
  ) {}

  async getHistory(userId: string, characterId: string): Promise<ChatMessageDto[] | undefined> {
    const history = await this.chatHistoryModel.findOne({ userId, characterId }).exec();
    if (!history) return undefined;
    const availablesTypes = [
      'roll',
      'xp',
      'hp',
      'spell',
      'inventory',
      'combat_start',
      'combat_end',
    ];
    return history.messages.map((msg) => {
      const instrs = (msg.instructions || [])
        .filter((v): v is GameInstructionDto => availablesTypes.includes(v.type));
      return {
        role: msg.role,
        narrative: msg.narrative,
        instructions: instrs.length ? instrs : undefined,
      };
    });
  }

  getAbilityScore(character: CharacterResponseDto, key: keyof AbilityScoresResponseDto): number {
    return character.scores?.[key] || 0;
  }

  buildCharacterSummary(character: CharacterResponseDto): string {
    const armorClass = calculateArmorClass(character);
    let summary = `
    Character Information:
    - Name: ${character.name || 'Unknown'}
    - Race: ${typeof character.race === 'object' ? character.race?.name : character.race || 'Unknown'}
    - Classes: ${character.classes?.map(c => `${c.name} (Lvl ${c.level})`).join(', ') || 'None'}
    - Gender: ${character.gender || 'Unknown'}
    - HP: ${character.hp || character.hpMax || 'Unknown'}/${character.hpMax || 'Unknown'}
    - AC: ${armorClass}
    - XP: ${character.totalXp || 0}
    - Level: 1
    - Stats:
      * STR ${this.getAbilityScore(character, 'Str')}
      * DEX ${this.getAbilityScore(character, 'Dex')}
      * CON ${this.getAbilityScore(character, 'Con')}
      * INT ${this.getAbilityScore(character, 'Int')}
      * WIS ${this.getAbilityScore(character, 'Wis')}
      * CHA ${this.getAbilityScore(character, 'Cha')}
    `;

    if (character.spells && character.spells.length > 0) {
      summary += `- Spells Known: ${character.spells.map(s => `${s.name} (Lvl ${s.level})`).join(', ')}\n`;
    }

    if (character.inventory && character.inventory.length > 0) {
      summary += `- Inventory: ${character.inventory.map(item => `${item.name} (x${item.qty || 1}) ${item.meta}`).join(', ')}\n`;
    }

    return summary;
  }

  formatHistoryForModel(chatMessage: ChatMessageDto): Content {
    return {
      role: chatMessage.role === 'assistant' ? 'model' : chatMessage.role,
      parts: [{ text: chatMessage.narrative }],
    };
  }

  async append(userId: string, characterId: string, msg: ChatMessageDto) {
    let history = await this.chatHistoryModel.findOne({ userId, characterId });
    if (!history) {
      history = new this.chatHistoryModel({
        userId,
        characterId,
        messages: [msg],
        lastUpdated: new Date(),
      });
      await history.save();
      this.logger.log(`💬 Saved new history to character ${characterId})`);
      return;
    }

    history.messages.push(msg);
    if (history.messages.length > this.MAX_MESSAGES) {
      history.messages = history.messages.slice(-this.MAX_MESSAGES);
    }
    history.lastUpdated = new Date();

    await history.save();
    this.logger.log(`💬 Saved message to character ${characterId} (${history.messages.length} messages)`);
  }
}
