import {
  Controller, Get,
  Logger,
  Req, Res, UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { RPGRequest } from '../global.types.js';
import { AuthProfileDto } from '../domain/auth/auth.profile.dto.js';
import { AuthService } from '../domain/auth/auth.service.js';
import { GoogleAuthGuard } from '../domain/auth/google-auth.guard.js';
import { JwtAuthGuard } from '../domain/auth/jwt-auth.guard.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Get('google')
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: RPGRequest, @Res() res: Response) {
    try {
      const { user } = req;
      const loginResult = await this.authService.login(user);

      this.logger.log(`User logged in: ${user.email}`);

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:80';
      res.redirect(`${frontendUrl}/auth/callback?token=${loginResult.access_token}`);
    } catch (error) {
      this.logger.error('Google auth callback error', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:80';
      res.redirect(`${frontendUrl}/auth/error`);
    }
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'List of characters',
    type: AuthProfileDto,
  })
  getProfile(@Req() req: RPGRequest) {
    const { user } = req;
    return {
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName,
      picture: user.picture,
    };
  }

  @Get('logout')
  @ApiOperation({ summary: 'Logout (client should clear token)' })
  logout() {
    return { message: 'Logged out successfully' };
  }
}
