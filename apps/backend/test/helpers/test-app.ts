/**
 * Test application bootstrap utilities for integration tests.
 * Uses MongoMemoryServer for isolated, in-memory MongoDB instances.
 */
import { Test, TestingModule } from "@nestjs/testing";
import { MongooseModule } from "@nestjs/mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import path from "path";
import os from "os";
import fs from "fs";
import type { INestApplication } from "@nestjs/common";
import type { Connection } from "mongoose";
import { getConnectionToken } from "@nestjs/mongoose";
import { GeminiImageService } from "../../src/bounded-contexts/character/infrastructure/external/GeminiImageService.js";
import { GeminiTextService } from "../../src/bounded-contexts/game-narrative/infrastructure/external/index.js";

// Initialize configuration for tests
let configInitialized = false;
async function ensureConfigLoaded() {
  if (configInitialized) return;
  
  // Set NODE_ENV to development for tests to use development.json config
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  
  // Load the config
  const { loadConfig } = await import("../../src/config.js");
  try {
    loadConfig();
  } catch {
    // Config may already be loaded, ignore
  }
  configInitialized = true;
}

// Mock for GeminiImageService to avoid API calls in tests
const mockGeminiImageService = {
  generateImage: async () => "data:image/svg+xml;base64,mock-image",
};

// Mock for GeminiTextService to avoid API calls in tests
const mockGeminiTextService = {
  chat: async () => ({ narrative: "Mock response from AI" }),
  generateText: async () => "Mock generated text",
};

export interface TestAppContext {
  app: INestApplication;
  module: TestingModule;
  mongoServer: MongoMemoryServer;
  mongoConnection: Connection;
}

/**
 * Create a test application with in-memory MongoDB.
 * @param imports - NestJS modules to import (e.g., CombatModule)
 * @param overrides - Optional provider overrides for mocking services (support both useValue and useClass)
 */
export async function createTestApp(
  imports: Parameters<typeof Test.createTestingModule>[0]["imports"],
  overrides?: Array<{
    provide: unknown;
    useValue?: unknown;
    useClass?: unknown;
  }>,
): Promise<TestAppContext> {
  // Ensure config is loaded before creating modules that depend on it
  await ensureConfigLoaded();
  
  // Start in-memory MongoDB
  // Use a unique download/cache directory per test run to avoid lockfile collisions
  // seen in concurrent CI runners or previous cached binaries. We pick a tmpdir path
  // using the process pid and timestamp to ensure uniqueness.
  const downloadDir = path.join(os.tmpdir(), `mongodb-binaries-${process.pid}-${Date.now()}`);
  // Make sure directory exists before passing to the server
  await fs.promises.mkdir(downloadDir, { recursive: true });
  const mongoServer = await MongoMemoryServer.create({ binary: { downloadDir } });
  const mongoUri = mongoServer.getUri();

  // Build testing module
  let moduleBuilder = Test.createTestingModule({
    imports: [MongooseModule.forRoot(mongoUri), ...(imports ?? [])],
  });

  // Always mock Gemini services to avoid external API calls
  moduleBuilder = moduleBuilder.overrideProvider(GeminiImageService).useValue(mockGeminiImageService);
  moduleBuilder = moduleBuilder.overrideProvider(GeminiTextService).useValue(mockGeminiTextService);

  // Apply additional provider overrides (e.g., mock DiceService or JWT guard)
  if (overrides) {
    overrides.forEach(override => {
      if (override.useClass) {
        moduleBuilder = moduleBuilder.overrideProvider(override.provide).useClass(override.useClass);
      } else if (override.useValue !== undefined) {
        moduleBuilder = moduleBuilder.overrideProvider(override.provide).useValue(override.useValue);
      }
    });
  }

  const module = await moduleBuilder.compile();
  const app = module.createNestApplication();
  await app.init();

  const mongoConnection = module.get<Connection>(getConnectionToken());

  return {
    app,
    module,
    mongoServer,
    mongoConnection,
  };
}

/**
 * Close and cleanup the test application and MongoDB instance.
 */
export async function closeTestApp(ctx: TestAppContext): Promise<void> {
  await ctx.app.close();
  await ctx.mongoConnection.close();
  await ctx.mongoServer.stop();
}

/**
 * Clear all collections in the test database.
 * Useful for resetting state between tests.
 */
export async function clearDatabase(ctx: TestAppContext): Promise<void> {
  const { collections } = ctx.mongoConnection;
  const keys = Object.keys(collections);
  await Promise.all(keys.map(key => collections[key].deleteMany({})));
}
