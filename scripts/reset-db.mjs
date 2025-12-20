#!/usr/bin/env node

/**
 * Reset database for new stats/skills system
 * Clears obsolete collections and resets to fresh seeds
 */

import mongoose from "mongoose";
import { config } from "config";

const mongoUri = config.get("mongo.uri");

async function resetDatabase() {
  try {
    console.log("Connecting to MongoDB...", mongoUri);
    await mongoose.connect(mongoUri);

    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection failed");

    // Collections to drop (obsolete)
    const obsoleteCollections = [
      "classlevels",
      "classlevelfeatures",
      "classlevellevelchoices",
    ];

    console.log("\n🗑️  Dropping obsolete collections...");
    for (const collection of obsoleteCollections) {
      try {
        await db.dropCollection(collection);
        console.log(`  ✓ Dropped ${collection}`);
      } catch (err) {
        if ((err as any)?.code === 26) {
          console.log(`  - ${collection} doesn't exist (OK)`);
        } else {
          throw err;
        }
      }
    }

    // Clear and reset data collections
    console.log("\n🔄 Resetting data collections...");
    const resetCollections = ["races", "classdefinitions"];

    for (const collection of resetCollections) {
      try {
        await db.collection(collection).deleteMany({});
        console.log(`  ✓ Cleared ${collection}`);
      } catch (err) {
        console.log(`  - ${collection} doesn't exist (OK)`);
      }
    }

    console.log("\n✅ Database reset complete!");
    console.log("\nNext step: Run 'npm run seed' to load fresh data\n");

    await mongoose.disconnect();
  } catch (err) {
    console.error("\n❌ Reset failed:", err);
    process.exit(1);
  }
}

resetDatabase();
