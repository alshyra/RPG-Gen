/**
 * Test application bootstrap utilities for integration tests.
 * Uses MongoMemoryServer for isolated, in-memory MongoDB instances.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { INestApplication } from '@nestjs/common';
import type { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

export interface TestAppContext {
  app: INestApplication;
  module: TestingModule;
  mongoServer: MongoMemoryServer;
  mongoConnection: Connection;
}

/**
 * Create a test application with in-memory MongoDB.
 * @param imports - NestJS modules to import (e.g., CombatModule)
 * @param overrides - Optional provider overrides for mocking services
 */
export async function createTestApp(
  imports: Parameters<typeof Test.createTestingModule>[0]['imports'],
  overrides?: {
    provide: unknown;
    useValue: unknown;
  }[],
): Promise<TestAppContext> {
  // Start in-memory MongoDB
  const mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Build testing module
  let moduleBuilder = Test.createTestingModule({
    imports: [
      MongooseModule.forRoot(mongoUri),
      ...(imports ?? []),
    ],
  });

  // Apply provider overrides (e.g., mock DiceService)
  if (overrides) {
    for (const override of overrides) {
      moduleBuilder = moduleBuilder.overrideProvider(override.provide)
        .useValue(override.useValue);
    }
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
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}
