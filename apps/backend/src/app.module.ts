import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./bounded-contexts/auth/auth.module.js";
import { CharacterModule } from "./bounded-contexts/character/character.module.js";
import { GameNarrativeModule } from "./bounded-contexts/game-narrative/game-narrative.module.js";
import { ArchetypeModule } from "./bounded-contexts/archetype/archetype.module.js";
import { CombatModule } from "./bounded-contexts/combat/combat.module.js";
import { GameDataModule } from "./bounded-contexts/game-data/game-data.module.js";
import { HealthModule } from "./bounded-contexts/health/health.module.js";
import { ProgressionModule } from "./modules/progression.module.js";
import { RacesModule } from "./bounded-contexts/race/races.module.js";
import { AptitudeModule } from "./bounded-contexts/aptitude/aptitude.module.js";
import { getConfig } from "./config.js";
import { ConfigModule } from "./config.module.js";

@Module({
  imports: [
    MongooseModule.forRoot(getConfig().mongodb.uri, {
      retryAttempts: 5,
      retryDelay: 3000,
    }),
    ConfigModule,
    AptitudeModule,
    AuthModule,
    GameNarrativeModule,
    ArchetypeModule,
    CombatModule,
    GameDataModule,
    HealthModule,
    CharacterModule,
    ProgressionModule,
    RacesModule,
  ],
})
export class AppModule {}
