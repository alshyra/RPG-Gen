import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from '../controllers/auth.controller.js';
import { AuthService } from '../domain/auth/auth.service.js';
import { JwtStrategy } from '../domain/auth/jwt.strategy.js';
import { GoogleStrategy } from '../domain/auth/google.strategy.js';
import {
  User, UserSchema,
} from '../infra/mongo/user.schema.js';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
      signOptions: { expiresIn: '7d' },
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
    AuthService,
    JwtStrategy,
    GoogleStrategy,
  ],
  exports: [
    AuthService,
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}
