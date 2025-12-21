import { Content } from "@google/genai";
import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { CharacterResponseDto } from "../character/dto/CharacterResponseDto.js";
import type { ChatMessageDto } from "./dto/ChatMessageDto.js";
import type { GameInstructionDto } from "./dto/GameInstructionDto.js";
import { ChatHistory, ChatHistoryDocument } from "../../infra/mongo/chat/ChatHistory.js";
import { CLASS_STATS } from "../combat/scaling.util.js";

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name);
  private readonly MAX_MESSAGES = Number(process.env.CONV_MAX_MESSAGES || "60");

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
      "roll",
      "xp",
      "hp",
      "spell",
      "inventory",
      "combat_start",
      "combat_end",
    ];
    return history.messages.map(msg => ({
      role: msg.role,
      narrative: msg.narrative,
      instructions: (msg.instructions || []).filter((v): v is GameInstructionDto =>
        availablesTypes.includes(v.type),
      ),
    }));
  }

  buildCharacterSummary(character: CharacterResponseDto): string {
    const className = character.className ?? "guerrier";
    const classStats = CLASS_STATS[className.toLowerCase()] ?? CLASS_STATS.guerrier;
    const stats = character.stats ?? { vigor: 0, finesse: 0, mind: 0, survival: 0 };

    let summary = `
    Character Information:
    - Name: ${character.name || "Unknown"}
    - Race: ${typeof character.race === "object" ? character.race?.name : character.race || "Unknown"}
    - Class: ${className}
    - Level: ${character.level ?? 1}
    - Gender: ${character.gender || "Unknown"}
    - HP: ${character.hp ?? character.hpMax ?? "Unknown"}/${character.hpMax ?? "Unknown"}
    - PA: ${character.pa ?? classStats.pa}/${character.paMax ?? classStats.pa}
    - PM: ${character.pm ?? classStats.pm}/${character.pmMax ?? classStats.pm}
    - XP: ${character.totalXp || 0}
    - Stats:
      * Vigueur: ${stats.vigor}
      * Finesse: ${stats.finesse}
      * Esprit: ${stats.mind}
      * Survie: ${stats.survival}
    `;

    if (character.aptitudes && character.aptitudes.length > 0) {
      summary += `- Aptitudes Learned: ${character.aptitudes
        .map(a => `${a.name}`)
        .join(", ")}\n`;
    }

    if (character.inventory && character.inventory.length > 0) {
      summary += `- Inventory: ${character.inventory
        .map(item => `${item.name} (x${item.qty || 1}) ${JSON.stringify(item.meta)}`)
        .join(", ")}\n`;
    }

    return summary;
  }

  formatHistoryForModel(chatMessage: ChatMessageDto): Content {
    return {
      role: chatMessage.role === "assistant" ? "model" : chatMessage.role,
      parts: [{ text: chatMessage.narrative }],
    };
  }

  async append(userId: string, characterId: string, msg: ChatMessageDto) {
    if (!msg.narrative) throw new InternalServerErrorException("Message narrative is required");
    
    const history = await this.chatHistoryModel.findOne({
      userId,
      characterId,
    });
    if (!history) {
      const chatHistory = new ChatHistory({
        userId,
        characterId,
        messages: [
          {
            role: msg.role ?? "user",
            narrative: msg.narrative || "Something went wrong.",
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
      role: msg.role ?? "user",
      narrative: msg.narrative || "Something went wrong.",
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
