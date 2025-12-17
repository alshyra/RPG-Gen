import { Chat, Content, GoogleGenAI } from "@google/genai";
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { readFile } from "fs/promises";
import path from "path";
import { ChatMessageDto } from "../../domain/chat/dto/ChatMessageDto.js";
import { GameInstructionDto } from "../../domain/chat/dto/GameInstructionDto.js";
import { geminiResponseJsonSchema } from "./gemini-json-schema.js";
import { aiResponseSchema } from "./gemini-schemas.js";
import { CharacterResponseDto } from "../../domain/character/dto/index.js";
import { getConfig } from "../../config.js";

const TEMPLATE_PATH = process.env.TEMPLATE_PATH ?? path.join(process.cwd(), "chat.prompt.txt");
const SCENARIO_PATH =
  process.env.SCENARIO_PATH ?? path.join(process.cwd(), "assets/scenarii", "arene.txt");

@Injectable()
export class GeminiTextService {
  private readonly logger = new Logger(GeminiTextService.name);
  private client: GoogleGenAI;
  private model = "gemini-2.5-pro";
  private chatClients = new Map<string, Chat>();
  private systemPrompt: string;

  constructor() {
    const config = getConfig();
    this.logger.debug(
      "Initializing GeminiTextService",
      config.google.apiKey ? "***" : "no API key",
    );
    this.client = new GoogleGenAI({ apiKey: config.google.apiKey });
    void Promise.all([this.loadSystemPrompt(), this.loadScenarii()]).then(
      ([systemPrompt, scenarioPrompt]) => {
        this.systemPrompt = systemPrompt + "\n\n" + scenarioPrompt;
        this.logger.log("System prompt and scenario loaded successfully !");
      },
    );
  }

  private async loadSystemPrompt(): Promise<string> {
    this.logger.log(`Loading system prompt from ${TEMPLATE_PATH}`);
    return await readFile(TEMPLATE_PATH, "utf8");
  }

  private async loadScenarii(): Promise<string> {
    this.logger.log(`Loading scenario prompt from ${SCENARIO_PATH}`);
    return await readFile(SCENARIO_PATH, "utf8");
  }
  initializeChatSession(
    sessionId: string,
    systemInstruction: string,
    initialHistory: ChatMessageDto[] = [],
  ) {
    if (this.chatClients.has(sessionId)) return;

    this.logger.debug(`Creating new chat client for session ${sessionId}`);
    this.logger.debug(
      `System instruction: ${initialHistory.map(message => message.narrative).join(", ")}...`,
    );
    const history = initialHistory.map(
      message =>
        ({
          role: "assistant" == message.role ? "model" : "user",
          parts: [{ text: message.narrative }],
        }) as Content,
    );
    this.logger.debug(history);
    const chat = this.client.chats.create({
      model: this.model,
      history,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseJsonSchema: geminiResponseJsonSchema,
      },
    });
    this.chatClients.set(sessionId, chat);
  }

  hasChatSession(sessionId: string): boolean {
    return this.chatClients.has(sessionId);
  }

  async sendMessage(sessionId: string, message: string): Promise<ChatMessageDto> {
    const chat = this.chatClients.get(sessionId);
    if (!chat) throw new Error(`Chat session ${sessionId} not found. Call getOrCreateChat first.`);

    this.logger.debug(`Sending message: ${message.slice(0, 50)}...`);
    let text: string | undefined;
    try {
      const response = await chat.sendMessage({ message });
      text = response.text;
    } catch {
      throw new ServiceUnavailableException(
        "Gemini API is temporarily unavailable. Please try again in a moment.",
      );
    }

    this.logger.debug(`Received structured response for session ${sessionId}`, text);
    if (!text)
      throw new InternalServerErrorException(`No response from AI service for message: ${message}`);

    try {
      const parsed = JSON.parse(text);

      let normalized = parsed;
      if (Array.isArray(parsed?.instructions)) {
        normalized = {
          ...parsed,
          instructions: parsed.instructions.map(inst => {
            if (
              inst &&
              typeof inst === "object" &&
              "payload" in inst &&
              typeof inst.payload === "object"
            ) {
              // Merge payload fields into the instruction, prefer payload fields but keep type from wrapper
              return {
                type: inst.type,
                ...inst.payload,
              };
            }
            return inst;
          }),
        };
      }

      const validated = aiResponseSchema.parse(normalized);

      const chatMessage: ChatMessageDto = {
        role: "assistant",
        narrative: validated.narrative,
        instructions: validated.instructions as GameInstructionDto[] | undefined,
      };

      return chatMessage;
    } catch (error) {
      // Log error details without exposing full response content
      this.logger.error("Failed to parse Gemini structured response", {
        error: error instanceof Error ? error.message : String(error),
        responseLength: text.length,
        responsePreview: text.slice(0, 100),
      });
      throw new InternalServerErrorException("Invalid AI response format");
    }
  }

  clearChat(sessionId: string) {
    this.chatClients.delete(sessionId);
    this.logger.debug(`Cleared chat session ${sessionId}`);
  }

  public initPrompt(character: CharacterResponseDto, characterSummary: string) {
    return `${this.systemPrompt}\n\n${characterSummary}`;
  }
}
