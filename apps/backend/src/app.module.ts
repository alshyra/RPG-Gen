import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./bounded-contexts/auth/auth.module.js";
import { CharacterModule } from "./bounded-contexts/character/character.module.js";
import { GameNarrativeModule } from "./bounded-contexts/game-narrative/game-narrative.module.js";
import { CombatModule } from "./bounded-contexts/combat/combat.module.js";
import { GameDataModule } from "./bounded-contexts/game-data/game-data.module.js";
import { HealthModule } from "./shared/health/health.module.js";
import { getConfig } from "./config.js";
import { ConfigModule } from "./config.module.js";

@Module({
  imports: [
    MongooseModule.forRoot(getConfig().mongodb.uri, {
      retryAttempts: 5,
      retryDelay: 3000,
    }),
    ConfigModule,
    AuthModule,
    GameNarrativeModule,
    CombatModule,
    GameDataModule,
    HealthModule,
    CharacterModule,
  ],
})
export class AppModule {}
