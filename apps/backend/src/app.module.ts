import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./bounded-contexts/auth/auth.module.js";
import { CharacterModule } from "./bounded-contexts/character/character.module.js";
import { ChatModule } from "./bounded-contexts/chat/chat.module.js";
import { ClassesModule } from "./bounded-contexts/archetype/archetype.module.js";
import { CombatModule } from "./bounded-contexts/combat/combat.module.js";
import { DiceModule } from "./modules/dice.module.js";
import { HealthModule } from "./modules/health.module.js";
import { ImageModule } from "./bounded-contexts/media/media.module.js";
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
    ChatModule,
    ClassesModule,
    CombatModule,
    DiceModule,
    ImageModule,
    HealthModule,
    CharacterModule,
    ProgressionModule,
    RacesModule,
  ],
})
export class AppModule {}
