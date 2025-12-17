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
  private model = "gemini-2.5-flash";
  private chatClients = new Map<string, Chat>();
  private systemPrompt: string;

  constructor() {
    const config = getConfig();
    this.logger.debug(
      "Initializing GeminiTextService",
      config.google.apiKey ? "***" : "no API key",
    );
    this.client = new GoogleGenAI({ apiKey: config.google.apiKey });
    Promise.all([this.loadSystemPrompt(), this.loadScenarii()]).then(
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
    } catch (error) {
      // Handle Gemini API errors (e.g., model overloaded with 503 status)
      const geminiError = this.extractGeminiError(error);
      if (geminiError?.status === "UNAVAILABLE" || geminiError?.code === 503) {
        this.logger.warn("Gemini API overloaded or unavailable (503)", {
          code: geminiError.code,
          status: geminiError.status,
        });
        throw new ServiceUnavailableException(
          "Gemini API is temporarily unavailable. Please try again in a moment.",
        );
      }
      // Re-throw any other unexpected error
      this.logger.error("Unexpected error while calling Gemini API", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
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

  /**
   * Extract error details from a Gemini API error
   * Handles nested ApiError structure: { ApiError: { error: { code, message, status } } }
   */
  private extractGeminiError(
    error: unknown,
  ): { code?: number; status?: string; message?: string } | null {
    if (!error || typeof error !== "object") return null;

    // Check if it's the outer ApiError wrapper
    const errorObj = error as Record<string, unknown>;
    if ("ApiError" in errorObj && errorObj.ApiError && typeof errorObj.ApiError === "object") {
      const apiError = errorObj.ApiError as Record<string, unknown>;
      if ("error" in apiError && apiError.error && typeof apiError.error === "object") {
        const innerError = apiError.error as Record<string, unknown>;
        return {
          code: typeof innerError.code === "number" ? innerError.code : undefined,
          status: typeof innerError.status === "string" ? innerError.status : undefined,
          message: typeof innerError.message === "string" ? innerError.message : undefined,
        };
      }
    }

    // Also check direct error structure in case format changes
    if ("error" in errorObj && typeof errorObj.error === "object") {
      const innerError = errorObj.error as Record<string, unknown>;
      if ("code" in innerError || "status" in innerError) {
        return {
          code: typeof innerError.code === "number" ? innerError.code : undefined,
          status: typeof innerError.status === "string" ? innerError.status : undefined,
          message: typeof innerError.message === "string" ? innerError.message : undefined,
        };
      }
    }

    return null;
  }

  public initPrompt(character: CharacterResponseDto, characterSummary: string) {
    return `${this.systemPrompt}\n\n${characterSummary}`;
  }
}
