import { Content } from '@google/genai';
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Schema, Types } from 'mongoose';
import { AbilityScoresResponseDto } from '../character/dto/AbilityScoresResponseDto.js';
import { calculateArmorClass } from '../character/armor-class.util.js';
import type { CharacterResponseDto } from '../character/dto/CharacterResponseDto.js';
import type { ChatMessageDto } from './dto/ChatMessageDto.js';
import type { GameInstructionDto } from './dto/GameInstructionDto.js';
import { ChatHistory, ChatHistoryDocument } from '../../infra/mongo/chat/ChatHistory.js';

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  private readonly MAX_MESSAGES = Number(process.env.CONV_MAX_MESSAGES || '60');

  constructor(
    @InjectModel(ChatHistory.name) private chatHistoryModel: Model<ChatHistoryDocument>,
  ) {}

  async getHistoryMessages(
    userId: string,
    characterId: string,
  ): Promise<ChatMessageDto[] | undefined> {
    const history = await this.chatHistoryModel
      .findOne({
        userId,
        characterId,
      })
      .exec();
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
    return history.messages.map(msg => ({
      role: msg.role,
      narrative: msg.narrative,
      instructions: (msg.instructions || []).filter((v): v is GameInstructionDto =>
        availablesTypes.includes(v.type),
      ),
    }));
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
      summary += `- Spells Known: ${character.spells
        .map(s => `${s.name} (Lvl ${s.level})`)
        .join(', ')}\n`;
    }

    if (character.inventory && character.inventory.length > 0) {
      summary += `- Inventory: ${character.inventory
        .map(item => `${item.name} (x${item.qty || 1}) ${item.meta}`)
        .join(', ')}\n`;
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
    if (!msg.narrative) throw new InternalServerErrorException('Message narrative is required');
    const history = await this.chatHistoryModel
      .findOne({
        userId,
        characterId,
      })
    if (!history) {
      const chatHistory = new ChatHistory({
        userId: userId as unknown as Schema.Types.ObjectId,
        characterId,
        messages: [
          {
            role: msg.role ?? 'user',
            narrative: msg.narrative || 'Something went wrong.',
            instructions: msg.instructions || [],
          },
        ],
        lastUpdated: new Date(),
      });
      const newHistory = new this.chatHistoryModel(chatHistory);
      await newHistory.save();
      this.logger.log(`💬 Saved new history to character ${characterId})`);
      return;
    }
    this.logger.log(`💬 Saved new history to character ${characterId})`, msg);
    history.messages.push({
      role: msg.role ?? 'user',
      narrative: msg.narrative || 'Something went wrong.',
      instructions: msg.instructions || [],
    });
    history.lastUpdated = new Date();

    this.logger.log(`💬 Saved new history to character ${characterId})`, history);
    await history.save();
    this.logger.log(
      `💬 Saved message to character ${characterId} (${history.messages.length} messages)`,
    );
  }
}
