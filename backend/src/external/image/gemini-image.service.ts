import { Injectable, Logger } from "@nestjs/common";
import { GenerateContentResponse, GoogleGenAI } from "@google/genai";

@Injectable()
export class GeminiImageService {
  private readonly logger = new Logger(GeminiImageService.name);
  private client: GoogleGenAI | null = null;
  private model = "gemini-2.0-flash-preview-image-generation";

  constructor() {
    this.logger.debug(
      "Initializing GeminiImageService",
      process.env.GOOGLE_API_KEY ? "***" : "no API key"
    );
    this.client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  }

  private isMock() {
    return process.env.MOCK_GEMINI === "true";
  }

  private mockImage(): string {
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjZmZmIiBzdHlsZT0idGV4dC1hbmNob3I6IG1pZGRsZTsiPltsTU9DSyBDSEFSQUNURVJdPC90ZXh0Pjwvc3ZnPg==";
  }

  async generateImage(prompt: string): Promise<string> {
    if (this.isMock()) return this.mockImage();
    this.logger.debug(`Generating image with prompt: ${prompt.slice(0, 100)}...`);
    const response = await this.callGenerativeModel(prompt);
    return this.extractImageUrl(response);
  }

  private async callGenerativeModel(prompt: string): Promise<GenerateContentResponse> {
    try {
      return (await this.client.models.generateContent({
        model: this.model,
        contents: [{ parts: [{ text: prompt }] }],
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("Gemini API call failed:", message);
      throw error;
    }
  }

  private extractImageUrl(response: GenerateContentResponse): string {
    const imageUrl = this.extractImageFromResponse(response);
    if (!imageUrl) throw new Error("No image generated in response");
    return imageUrl;
  }

  private extractImageFromResponse(response: GenerateContentResponse): string | null {
    const parts = response?.candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) return null;

    const imagePart = parts.find((part) => part.inlineData?.data || part.fileData?.fileUri);
    if (imagePart?.inlineData?.data) {
      return `data:image/jpeg;base64,${imagePart.inlineData.data}`;
    }
    if (imagePart?.fileData?.fileUri) {
      return imagePart.fileData.fileUri;
    }
    return null;
  }
}
