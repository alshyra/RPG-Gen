import { INestApplication, Logger } from "@nestjs/common";
import { GameDataSeeder } from "./bounded-contexts/game-data/infrastructure/seeding/GameDataSeeder.js";

/**
 * Seed all game data using the GameDataSeeder service
 * Called from main.ts during application bootstrap
 */
export async function seedAllData(app: INestApplication, logger: Logger): Promise<void> {
  try {
    const seeder = app.get(GameDataSeeder);
    await seeder.seedAll();
    logger.log("Game data seeding completed successfully");
  } catch (error) {
    logger.error("Failed to seed game data", error);
    throw error;
  }
}
