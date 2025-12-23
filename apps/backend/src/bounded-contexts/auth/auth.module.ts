import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthController } from "./api/controllers/auth.controller.js";
import { AuthAppService } from "./application/services/AuthAppService.js";
import { IUserRepository } from "./domain/repositories/IUserRepository.js";
import { JwtStrategy } from "./infrastructure/auth/strategies/JwtStrategy.js";
import { GoogleStrategy } from "./infrastructure/auth/strategies/GoogleStrategy.js";
import { JwtAuthGuard } from "./infrastructure/auth/guards/JwtAuthGuard.js";
import { GoogleAuthGuard } from "./infrastructure/auth/guards/GoogleAuthGuard.js";
import { MongoUserRepository } from "./infrastructure/persistence/mongo/MongoUserRepository.js";
import { User, UserSchema } from "./infrastructure/persistence/mongo/schemas/UserDocument.js";

/**
 * AuthModule
 *
 * Bounded context for authentication and user identity management.
 *
 * Architecture:
 * - API layer: AuthController (routes)
 * - Application layer: AuthAppService (orchestration)
 * - Domain layer: AuthUser entity, IUserRepository port (framework-agnostic)
 * - Infrastructure layer: 
 *   - auth/: Passport strategies, NestJS guards
 *   - persistence/: MongoDB adapter, mapper, schema
 *
 * DI Pattern:
 * - IUserRepository bound to MongoUserRepository (port/adapter)
 * - Strategies/AppService inject IUserRepository abstraction
 * - Module provides all infrastructure implementations
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || "default-secret-change-in-production",
      signOptions: { expiresIn: "7d" },
    }),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    // Application service
    AuthAppService,

    // Infrastructure - Auth (Strategies & Guards)
    JwtStrategy,
    GoogleStrategy,
    JwtAuthGuard,
    GoogleAuthGuard,

    // Infrastructure - Persistence (Port/Adapter binding)
    {
      provide: IUserRepository,
      useClass: MongoUserRepository,
    },
  ],
  exports: [AuthAppService, JwtAuthGuard, GoogleAuthGuard, JwtModule, PassportModule],
})
export class AuthModule {}
